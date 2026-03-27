import { Component, computed, inject, signal, DestroyRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
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
  selector: 'app-invoices-expenses-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './invoices-expenses-register.component.html',
  styleUrl: './invoices-expenses-register.component.css'
})
export class InvoicesExpensesRegisterComponent {

  // ── Inyección de dependencias ─────────────────────────────────────────────
  private readonly fb                    = inject(FormBuilder);
  private readonly expensesServices      = inject(ExpensesService);
  private readonly router                = inject(Router);
  protected readonly expensesUtilService = inject(ExpensesUtilHelper);
  private readonly formValidationService = inject(FormValidationHelper);
  private readonly fileUploadService     = inject(FileUploadService);
  private readonly destroyRef            = inject(DestroyRef);

  // ── Formulario (class field — permite que toSignal y computed sean class fields) ──
  readonly expenseForm = this.fb.group({
    expense_date:         [this.expensesUtilService.getCurrentDateForInput(), [Validators.required]],
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
  // toSignal suscribe a valueChanges y expone el valor actual como Signal.
  // initialValue garantiza que computed() tenga valor desde el primer render.
  private readonly formValues = toSignal(this.expenseForm.valueChanges, {
    initialValue: this.expenseForm.value
  });

  // ── Estado UI ─────────────────────────────────────────────────────────────
  readonly isSubmitting = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly isDragOver   = signal(false);
  readonly fileError    = signal('');

  // ── Computed reactivos ────────────────────────────────────────────────────
  // Valores derivados del formulario: se recalculan automáticamente cuando
  // amount o iva_percentage cambian. updateCalculations() ya no existe.

  readonly calculatedIVA = computed(() => {
    const { amount, iva_percentage } = this.formValues();
    return this.expensesUtilService.calculateIVAAmount(amount ?? 0, iva_percentage ?? 0);
  });

  readonly calculatedTotal = computed(() => {
    const { amount, iva_percentage } = this.formValues();
    return this.expensesUtilService.calculateTotal(amount ?? 0, iva_percentage ?? 0);
  });

  // Derivado de is_recurring — no necesita signal() manual ni .set()
  readonly showRecurrenceFields = computed(() =>
    this.formValues().is_recurring === true
  );

  // ── Constantes estáticas (nunca cambian → readonly, no signal()) ──────────
  readonly categoryLabels      = EXPENSE_CATEGORY_LABELS;
  readonly paymentMethodLabels = EXPENSE_PAYMENT_METHOD_LABELS;
  readonly recurrenceLabels    = EXPENSE_RECURRENCE_LABELS;
  readonly deductibleLabels    = DEDUCTIBLE_LABELS;

  constructor() {
    // Único efecto secundario no declarable: actualizar validators condicionales.
    // updateRecurrenceValidators() muta el FormGroup — no es un valor derivado.
    // Suscripción directa con takeUntilDestroyed: el Observable es la fuente,
    // no hace falta effect() porque no hay signals que rastrear aquí.
    this.expenseForm.get('is_recurring')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isRecurring => {
        this.formValidationService.updateRecurrenceValidators(
          this.expenseForm,
          isRecurring === true
        );
      });
  }

  // ── Helpers de formato (leen computed → sin lógica de cálculo) ───────────

  getFormattedIVA(): string {
    return this.expensesUtilService.formatAmountPlain(this.calculatedIVA());
  }

  getFormattedTotal(): string {
    return this.expensesUtilService.formatAmountPlain(this.calculatedTotal());
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
    if (!error) this.selectedFile.set(file);
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.fileError.set('');
  }

  formatFileSize(bytes: number): string {
    return this.fileUploadService.formatFileSize(bytes);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  registerExpense(): void {
    if (!this.expenseForm.valid || this.isSubmitting()) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const expenseData = this.expensesUtilService.prepareExpenseData(
      this.expenseForm.value as ExpenseFormValues
    );

    this.expensesServices
      .createExpense(expenseData, this.selectedFile() ?? undefined)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: () => {
          Swal.fire({
            title: 'Gasto registrado correctamente',
            text:  this.selectedFile() ? 'El archivo se ha adjuntado correctamente' : '',
            icon:  'success',
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
      title:             '¿Limpiar formulario?',
      text:              'Se perderán todos los datos ingresados',
      icon:              'question',
      showCancelButton:  true,
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText:  'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.expenseForm.reset({
          expense_date:   this.expensesUtilService.getCurrentDateForInput(),
          iva_percentage: 21,
          is_deductible:  true,
          payment_method: 'card',
          is_recurring:   false
        });
        this.selectedFile.set(null);
        this.fileError.set('');
        // calculatedIVA y calculatedTotal se recalculan automáticamente
        // cuando el form emite valueChanges tras el reset — no hay llamada manual
      }
    });
  }
}
