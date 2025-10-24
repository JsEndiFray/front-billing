import { Component, signal, effect, inject, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Swal from 'sweetalert2';
import { InternalExpense } from '../../../../interfaces/expenses-interface';
import {
  DEDUCTIBLE_LABELS,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_PAYMENT_METHOD_LABELS,
  EXPENSE_RECURRENCE_LABELS
} from '../../../../shared/Collection-Enum/collection-enum';
import { ExpensesService } from '../../../../core/services/entity-services/expenses.service';
import {ExpenseFormValues, ExpensesUtilHelper} from '../../../../core/helpers/expense-utils.helper';
import {FormValidationHelper} from '../../../../core/helpers/form-validation.helper';
import {FileUploadService} from '../../../../core/services/shared-services/file-upload.service';

@Component({
  selector: 'app-invoices-expenses-edit',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './invoices-expenses-edit.component.html',
  styleUrl: './invoices-expenses-edit.component.css'
})
export class InvoicesExpensesEditComponent {

  // ==========================================
  // INYECCIÓN DE DEPENDENCIAS
  // ==========================================
  private readonly fb = inject(FormBuilder);
  private readonly expensesServices = inject(ExpensesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly expensesUtilService = inject(ExpensesUtilHelper);
  private readonly formValidationService = inject(FormValidationHelper);
  private readonly fileUploadService = inject(FileUploadService);
  private readonly destroyRef = inject(DestroyRef);

  // ==========================================
  // SIGNALS - DATOS PRINCIPALES
  // ==========================================
  expenseId = signal<number | null>(null);
  currentExpense = signal<InternalExpense | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);
  showRecurrenceFields = signal<boolean>(false);

  // ==========================================
  // SIGNALS - MANEJO DE ARCHIVOS
  // ==========================================
  selectedFile = signal<File | null>(null);
  existingFileUrl = signal<string | null>(null);
  isDragOver = signal<boolean>(false);
  fileError = signal<string>('');

  // ==========================================
  // SIGNALS - CÁLCULOS REACTIVOS
  // ==========================================
  calculatedIVA = signal<number>(0);
  calculatedTotal = signal<number>(0);

  // ==========================================
  // SIGNALS - ETIQUETAS DE ENUM
  // ==========================================
  categoryLabels = signal(EXPENSE_CATEGORY_LABELS);
  paymentMethodLabels = signal(EXPENSE_PAYMENT_METHOD_LABELS);
  recurrenceLabels = signal(EXPENSE_RECURRENCE_LABELS);
  deductibleLabels = signal(DEDUCTIBLE_LABELS);

  // ==========================================
  // PROPIEDADES NORMALES
  // ==========================================
  expenseForm: FormGroup;

  constructor() {
    this.expenseForm = this.fb.group({
      expense_date: ['', [Validators.required]],
      category: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(3)]],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      supplier_name: ['', [Validators.required, Validators.minLength(2)]],
      subcategory: [''],
      supplier_nif: [''],
      supplier_address: [''],
      iva_percentage: [21, [Validators.required, Validators.min(0), Validators.max(100)]],
      is_deductible: [true],
      payment_method: ['card', [Validators.required]],
      receipt_number: [''],
      receipt_date: [''],
      property_id: [null],
      project_code: [''],
      cost_center: [''],
      notes: [''],
      is_recurring: [false],
      recurrence_period: [''],
      next_occurrence_date: ['']
    });

    // ==========================================
    // EFFECTS - LÓGICA REACTIVA
    // ==========================================

    // EFFECT: Cargar gasto por ID de la ruta
    effect(() => {
      const id = this.route.snapshot.paramMap.get('id');
      if (!id) {
        this.handleMissingId();
        return;
      }
      this.expenseId.set(parseInt(id, 10));
      this.loadExpenseDataReactive(this.expenseId()!);
    });

    // EFFECT: Mostrar/ocultar campos de recurrencia
    effect(() => {
      this.expenseForm.get('is_recurring')?.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((isRecurring) => {
          this.showRecurrenceFields.set(isRecurring === true);
          // DELEGADO: Ahora usa FormValidationHelper
          this.formValidationService.updateRecurrenceValidators(this.expenseForm, isRecurring === true);
        });
    });

    // EFFECT: Recalcular IVA y total cuando cambian amount o iva_percentage
    effect(() => {
      this.expenseForm.get('amount')?.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.updateCalculations());

      this.expenseForm.get('iva_percentage')?.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.updateCalculations());
    });

    // Calcular inicial
    this.updateCalculations();
  }

  // ==========================================
  // CÁLCULOS AUTOMÁTICOS
  // ==========================================

  /**
   * Actualiza los cálculos de IVA y Total
   * DELEGADO: Los cálculos están en ExpensesUtilService
   */
  private updateCalculations(): void {
    const amount = this.expenseForm.get('amount')?.value || 0;
    const ivaPercentage = this.expenseForm.get('iva_percentage')?.value || 0;

    this.calculatedIVA.set(this.expensesUtilService.calculateIVAAmount(amount, ivaPercentage));
    this.calculatedTotal.set(this.expensesUtilService.calculateTotal(amount, ivaPercentage));
  }

  getFormattedIVA(): string {
    return this.expensesUtilService.formatAmountPlain(this.calculatedIVA());
  }

  getFormattedTotal(): string {
    return this.expensesUtilService.formatAmountPlain(this.calculatedTotal());
  }

  // ==========================================
  // MANEJO DE ERRORES
  // ==========================================

  private handleMissingId(): void {
    Swal.fire({
      title: 'Error',
      text: 'ID de gasto no encontrado',
      icon: 'error',
      confirmButtonText: 'Ok'
    }).then(() => {
      this.router.navigate(['/dashboards/internal-expenses']);
    });
  }

  // ==========================================
  // CARGA DE DATOS
  // ==========================================

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
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.error.set('No se pudo cargar el gasto');
          Swal.fire({
            title: 'Error',
            text: 'No se pudo cargar el gasto',
            icon: 'error',
            confirmButtonText: 'Ok'
          }).then(() => {
            this.router.navigate(['/dashboards/internal-expenses']);
          });
        }
      });
  }

  private populateForm(expense: InternalExpense): void {
    this.expenseForm.patchValue({
      expense_date: this.expensesUtilService.formatDateForInput(expense.expense_date),
      category: expense.category,
      subcategory: expense.subcategory || '',
      description: expense.description,
      amount: expense.amount,
      iva_percentage: expense.iva_percentage,
      supplier_name: expense.supplier_name,
      supplier_nif: expense.supplier_nif || '',
      supplier_address: expense.supplier_address || '',
      is_deductible: expense.is_deductible,
      payment_method: expense.payment_method,
      receipt_number: expense.receipt_number || '',
      receipt_date: this.expensesUtilService.formatDateForInput(expense.receipt_date),
      property_id: expense.property_id || null,
      project_code: expense.project_code || '',
      cost_center: expense.cost_center || '',
      notes: expense.notes || '',
      is_recurring: expense.is_recurring || false,
      recurrence_period: expense.recurrence_period || '',
      next_occurrence_date: this.expensesUtilService.formatDateForInput(expense.next_occurrence_date)
    });

    if (expense.pdf_path) {
      this.existingFileUrl.set(expense.pdf_path);
    }

    // Recalcular con los valores cargados
    this.updateCalculations();

    this.expenseForm.markAsPristine();
  }

  // ==========================================
  // VALIDACIÓN DE CAMPOS
  // ==========================================

  isFieldInvalid(fieldName: string): boolean {
    const field = this.expenseForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.expenseForm.get(fieldName);
    return this.formValidationService.getErrorMessage(field);
  }

  // ==========================================
  // MANEJO DE ARCHIVOS
  // ==========================================

  onFileSelected(event: Event): void {
    const file = this.fileUploadService.onFileSelected(event);
    if (file) {
      this.processFile(file);
    }
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
    if (file) {
      this.processFile(file);
    }
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
      title: '¿Eliminar archivo?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.existingFileUrl.set(null);
      }
    });
  }

  formatFileSize(bytes: number): string {
    return this.fileUploadService.formatFileSize(bytes);
  }

  // ==========================================
  // CRUD - ACTUALIZACIÓN
  // ==========================================

  updateExpense(): void {
    if (!this.expenseForm.valid || this.isSubmitting() || !this.expenseId()) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    // DELEGADO: Preparación de datos ahora en ExpensesUtilService
    const expenseData = this.expensesUtilService.prepareExpenseData(
      this.expenseForm.value as ExpenseFormValues,
      this.expenseId(),
      this.currentExpense()?.status,
      this.existingFileUrl()
    );

    this.expensesServices
      .updateExpense(this.expenseId()!, expenseData, this.selectedFile() || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          Swal.fire({
            title: "Gasto actualizado correctamente",
            text: this.selectedFile() ? "El archivo se ha actualizado correctamente" : "",
            icon: "success",
            draggable: true
          });
          this.router.navigate(['/dashboards/internal-expenses/list']);
          this.isSubmitting.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          // Error manejado por interceptor
        }
      });
  }

  // ==========================================
  // NAVEGACIÓN
  // ==========================================

  goBack(): void {
    if (this.expenseForm.dirty) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'Tienes cambios sin guardar que se perderán',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
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
      title: '¿Restaurar valores originales?',
      text: 'Se perderán los cambios realizados',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const current = this.currentExpense();
        if (current) {
          this.populateForm(current);
          this.selectedFile.set(null);
          this.fileError.set('');
        }
      }
    });
  }

  canEdit(): boolean {
    const current = this.currentExpense();
    if (!current) return false;
    return this.expensesUtilService.canEdit(current);
  }
}
