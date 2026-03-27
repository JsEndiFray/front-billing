import { Component, computed, inject, signal, DestroyRef, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { InternalExpense } from '../../../../interfaces/expenses-interface';
import {
  DEDUCTIBLE_LABELS,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_PAYMENT_METHOD_LABELS,
  EXPENSE_RECURRENCE_LABELS
} from '../../../../shared/Collection-Enum/collection-enum';
import { ExpensesService } from '../../../../core/services/entity-services/expenses.service';
import { ExpenseFormValues, ExpensesUtilHelper } from '../../../../core/helpers/expense-utils.helper';
import { FormValidationHelper } from '../../../../core/helpers/form-validation.helper';
import { FileUploadService } from '../../../../core/services/shared-services/file-upload.service';

@Component({
  selector: 'app-invoices-expenses-edit',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './invoices-expenses-edit.component.html',
  styleUrl: './invoices-expenses-edit.component.css'
})
export class InvoicesExpensesEditComponent implements OnInit {

  // ── Inyección de dependencias ─────────────────────────────────────────────
  private readonly fb                    = inject(FormBuilder);
  private readonly expensesServices      = inject(ExpensesService);
  private readonly router                = inject(Router);
  private readonly route                 = inject(ActivatedRoute);
  protected readonly expensesUtilService = inject(ExpensesUtilHelper);
  private readonly formValidationService = inject(FormValidationHelper);
  private readonly fileUploadService     = inject(FileUploadService);
  private readonly destroyRef            = inject(DestroyRef);

  // ── Formulario (class field — permite toSignal y computed como class fields) ──
  readonly expenseForm = this.fb.group({
    expense_date:         ['', [Validators.required]],
    category:             ['', [Validators.required]],
    description:          ['', [Validators.required, Validators.minLength(3)]],
    amount:               [0, [Validators.required, Validators.min(0.01)]],
    supplier_name:        ['', [Validators.required, Validators.minLength(2)]],
    subcategory:          [''],
    supplier_nif:         [''],
    supplier_address:     [''],
    iva_percentage:       [21, [Validators.required, Validators.min(0), Validators.max(100)]],
    is_deductible:        [true],
    payment_method:       ['card', [Validators.required]],
    receipt_number:       [''],
    receipt_date:         [''],
    property_id:          [null as number | null],
    project_code:         [''],
    cost_center:          [''],
    notes:                [''],
    is_recurring:         [false],
    recurrence_period:    [''],
    next_occurrence_date: ['']
  });

  // ── Puente FormGroup → Signal ─────────────────────────────────────────────
  private readonly formValues = toSignal(this.expenseForm.valueChanges, {
    initialValue: this.expenseForm.value
  });

  // ── Estado: carga y datos del servidor ───────────────────────────────────
  readonly expenseId       = signal<number | null>(null);
  readonly currentExpense  = signal<InternalExpense | null>(null);
  readonly isLoading       = signal(false);
  readonly error           = signal<string | null>(null);

  // ── Estado UI ─────────────────────────────────────────────────────────────
  readonly isSubmitting    = signal(false);
  readonly selectedFile    = signal<File | null>(null);
  readonly existingFileUrl = signal<string | null>(null);
  readonly isDragOver      = signal(false);
  readonly fileError       = signal('');

  // ── Computed reactivos ────────────────────────────────────────────────────
  // Se recalculan automáticamente cuando amount o iva_percentage cambian
  // (también cuando patchValue() puebla el formulario al cargar el gasto).

  readonly calculatedIVA = computed(() => {
    const { amount, iva_percentage } = this.formValues();
    return this.expensesUtilService.calculateIVAAmount(amount ?? 0, iva_percentage ?? 0);
  });

  readonly calculatedTotal = computed(() => {
    const { amount, iva_percentage } = this.formValues();
    return this.expensesUtilService.calculateTotal(amount ?? 0, iva_percentage ?? 0);
  });

  // Derivado de is_recurring — reacciona automáticamente al cargar y al cambiar
  readonly showRecurrenceFields = computed(() =>
    this.formValues().is_recurring === true
  );

  // Derivado de currentExpense — memoizado: solo recalcula cuando cambia el gasto
  readonly canEdit = computed(() => {
    const current = this.currentExpense();
    return current ? this.expensesUtilService.canEdit(current) : false;
  });

  // ── Constantes estáticas (nunca cambian → readonly, no signal()) ──────────
  readonly categoryLabels      = EXPENSE_CATEGORY_LABELS;
  readonly paymentMethodLabels = EXPENSE_PAYMENT_METHOD_LABELS;
  readonly recurrenceLabels    = EXPENSE_RECURRENCE_LABELS;
  readonly deductibleLabels    = DEDUCTIBLE_LABELS;

  constructor() {
    // Único efecto secundario no declarable: actualizar validators condicionales.
    // Suscripción directa — el Observable es la fuente, no hace falta effect().
    this.expenseForm.get('is_recurring')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isRecurring => {
        this.formValidationService.updateRecurrenceValidators(
          this.expenseForm,
          isRecurring === true
        );
      });
  }

  // ── Carga inicial — ngOnInit porque depende del contexto de routing ───────
  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    if (!raw) {
      this.handleMissingId();
      return;
    }
    const parsedId = parseInt(raw, 10);
    this.expenseId.set(parsedId);
    this.loadExpenseDataReactive(parsedId); // usa la variable local, no el signal
  }

  // ── Helpers de formato ────────────────────────────────────────────────────

  getFormattedIVA(): string {
    return this.expensesUtilService.formatAmountPlain(this.calculatedIVA());
  }

  getFormattedTotal(): string {
    return this.expensesUtilService.formatAmountPlain(this.calculatedTotal());
  }

  // ── Manejo de errores ─────────────────────────────────────────────────────

  private handleMissingId(): void {
    Swal.fire({
      title:             'Error',
      text:              'ID de gasto no encontrado',
      icon:              'error',
      confirmButtonText: 'Ok'
    }).then(() => {
      this.router.navigate(['/dashboards/internal-expenses']);
    });
  }

  // ── Carga de datos ────────────────────────────────────────────────────────

  private loadExpenseDataReactive(id: number): void {
    this.isLoading.set(true);

    this.expensesServices.getExpenseById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (expense) => {
          this.currentExpense.set(expense);
          this.populateForm(expense);
          this.isLoading.set(false);
        },
        error: (_error: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.error.set('No se pudo cargar el gasto');
          Swal.fire({
            title:             'Error',
            text:              'No se pudo cargar el gasto',
            icon:              'error',
            confirmButtonText: 'Ok'
          }).then(() => {
            this.router.navigate(['/dashboards/internal-expenses']);
          });
        }
      });
  }

  private populateForm(expense: InternalExpense): void {
    this.expenseForm.patchValue({
      expense_date:         this.expensesUtilService.formatDateForInput(expense.expense_date),
      category:             expense.category,
      subcategory:          expense.subcategory          || '',
      description:          expense.description,
      amount:               expense.amount,
      iva_percentage:       expense.iva_percentage,
      supplier_name:        expense.supplier_name,
      supplier_nif:         expense.supplier_nif         || '',
      supplier_address:     expense.supplier_address     || '',
      is_deductible:        expense.is_deductible,
      payment_method:       expense.payment_method,
      receipt_number:       expense.receipt_number       || '',
      receipt_date:         this.expensesUtilService.formatDateForInput(expense.receipt_date),
      property_id:          expense.property_id          || null,
      project_code:         expense.project_code         || '',
      cost_center:          expense.cost_center          || '',
      notes:                expense.notes                || '',
      is_recurring:         expense.is_recurring         || false,
      recurrence_period:    expense.recurrence_period    || '',
      next_occurrence_date: this.expensesUtilService.formatDateForInput(expense.next_occurrence_date)
    });

    if (expense.pdf_path) {
      this.existingFileUrl.set(expense.pdf_path);
    }

    // calculatedIVA y calculatedTotal se recalculan automáticamente:
    // patchValue() emite valueChanges → toSignal actualiza formValues
    // → computed() recalcula sin llamada manual.

    this.expenseForm.markAsPristine();
  }

  // ── Validación de campos ──────────────────────────────────────────────────

  isFieldInvalid(fieldName: string): boolean {
    const field = this.expenseForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.expenseForm.get(fieldName);
    return this.formValidationService.getErrorMessage(field);
  }

  // ── Manejo de archivos ────────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const file = this.fileUploadService.onFileSelected(event);
    if (file) this.processFile(file);
  }

  onDragOver(event: DragEvent): void {
    this.fileUploadService.onDragOver(event);
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    this.fileUploadService.onDragLeave(event);
    this.isDragOver.set(false);
  }

  onFileDrop(event: DragEvent): void {
    const file = this.fileUploadService.onFileDrop(event);
    this.isDragOver.set(false);
    if (file) this.processFile(file);
  }

  processFile(file: File): void {
    const error = this.fileUploadService.validateFile(file);
    this.fileError.set(error);
    if (!error) {
      this.selectedFile.set(file);
      this.existingFileUrl.set(null);
    }
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.fileError.set('');
  }

  removeExistingFile(event: Event): void {
    event.stopPropagation();
    Swal.fire({
      title:             '¿Eliminar archivo?',
      text:              'Esta acción no se puede deshacer',
      icon:              'warning',
      showCancelButton:  true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText:  'Cancelar'
    }).then(result => {
      if (result.isConfirmed) this.existingFileUrl.set(null);
    });
  }

  formatFileSize(bytes: number): string {
    return this.fileUploadService.formatFileSize(bytes);
  }

  // ── CRUD — actualización ──────────────────────────────────────────────────

  updateExpense(): void {
    if (!this.expenseForm.valid || this.isSubmitting() || !this.expenseId()) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const expenseData = this.expensesUtilService.prepareExpenseData(
      this.expenseForm.value as ExpenseFormValues,
      this.expenseId(),
      this.currentExpense()?.status,
      this.existingFileUrl()
    );

    this.expensesServices
      .updateExpense(this.expenseId()!, expenseData, this.selectedFile() ?? undefined)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: () => {
          Swal.fire({
            title:     'Gasto actualizado correctamente',
            text:      this.selectedFile() ? 'El archivo se ha actualizado correctamente' : '',
            icon:      'success',
            draggable: true
          });
          this.router.navigate(['/dashboards/internal-expenses/list']);
        },
        error: (_e: HttpErrorResponse) => {
          // Error manejado por interceptor
        }
      });
  }

  // ── Navegación ────────────────────────────────────────────────────────────

  goBack(): void {
    if (this.expenseForm.dirty) {
      Swal.fire({
        title:             '¿Estás seguro?',
        text:              'Tienes cambios sin guardar que se perderán',
        icon:              'warning',
        showCancelButton:  true,
        confirmButtonText: 'Sí, salir',
        cancelButtonText:  'Cancelar'
      }).then(result => {
        if (result.isConfirmed) {
          this.router.navigate(['/dashboards/internal-expenses']);
        }
      });
    } else {
      this.router.navigate(['/dashboards/internal-expenses']);
    }
  }

  resetForm(): void {
    Swal.fire({
      title:             '¿Restaurar valores originales?',
      text:              'Se perderán los cambios realizados',
      icon:              'question',
      showCancelButton:  true,
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText:  'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        const current = this.currentExpense();
        if (current) {
          this.populateForm(current);
          this.selectedFile.set(null);
          this.fileError.set('');
          // calculatedIVA y calculatedTotal se recalculan automáticamente
          // cuando populateForm() llama a patchValue()
        }
      }
    });
  }
}
