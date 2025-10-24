import {Component, signal, effect, inject, DestroyRef} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import Swal from 'sweetalert2';
import {
  DEDUCTIBLE_LABELS,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_PAYMENT_METHOD_LABELS,
  EXPENSE_RECURRENCE_LABELS
} from '../../../../shared/Collection-Enum/collection-enum';
import {ExpensesService} from '../../../../core/services/entity-services/expenses.service';
import {ExpenseFormValues, ExpensesUtilHelper} from '../../../../core/helpers/expense-utils.helper';
import {FormValidationHelper} from '../../../../core/helpers/form-validation.helper';
import {FileUploadService} from '../../../../core/services/shared-services/file-upload.service';


@Component({
  selector: 'app-invoices-expenses-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './invoices-expenses-register.component.html',
  styleUrl: './invoices-expenses-register.component.css'
})
export class InvoicesExpensesRegisterComponent {

  // ==========================================
  // INYECCIÓN DE DEPENDENCIAS
  // ==========================================
  private readonly fb = inject(FormBuilder);
  private readonly expensesServices = inject(ExpensesService);
  private readonly router = inject(Router);
  protected readonly expensesUtilService = inject(ExpensesUtilHelper);
  private readonly formValidationService = inject(FormValidationHelper);
  private readonly fileUploadService = inject(FileUploadService);
  private readonly destroyRef = inject(DestroyRef);

  // ==========================================
  // SIGNALS - ESTADO DEL COMPONENTE
  // ==========================================
  isSubmitting = signal<boolean>(false);
  showRecurrenceFields = signal<boolean>(false);
  selectedFile = signal<File | null>(null);
  isDragOver = signal<boolean>(false);
  fileError = signal<string>('');
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
      expense_date: [this.expensesUtilService.getCurrentDateForInput(), [Validators.required]],
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

    // EFFECT: Recalcular IVA y total cuando cambian amount o iva_percentage
    effect(() => {
      this.expenseForm.get('amount')?.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.updateCalculations());

      this.expenseForm.get('iva_percentage')?.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.updateCalculations());
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

  /**
   * Obtiene IVA formateado para mostrar
   * DELEGADO: Formato en ExpensesUtilService
   */
  getFormattedIVA(): string {
    return this.expensesUtilService.formatAmountPlain(this.calculatedIVA());
  }

  /**
   * Obtiene Total formateado para mostrar
   * DELEGADO: Formato en ExpensesUtilService
   */
  getFormattedTotal(): string {
    return this.expensesUtilService.formatAmountPlain(this.calculatedTotal());
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
    }
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.fileError.set('');
  }

  formatFileSize(bytes: number): string {
    return this.fileUploadService.formatFileSize(bytes);
  }

  // ==========================================
  // CRUD - CREAR GASTO
  // ==========================================

  registerExpense(): void {
    if (!this.expenseForm.valid || this.isSubmitting()) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    // DELEGADO: Preparación de datos ahora en ExpensesUtilService
    const expenseData = this.expensesUtilService.prepareExpenseData(
      this.expenseForm.value as ExpenseFormValues
    );

    this.expensesServices
      .createExpense(expenseData, this.selectedFile() || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          Swal.fire({
            title: "Gasto registrado correctamente",
            text: this.selectedFile() ? "El archivo se ha adjuntado correctamente" : "",
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
      title: '¿Limpiar formulario?',
      text: 'Se perderán todos los datos ingresados',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.expenseForm.reset({
          expense_date: this.expensesUtilService.getCurrentDateForInput(),
          iva_percentage: 21,
          is_deductible: true,
          payment_method: 'card',
          is_recurring: false
        });
        this.selectedFile.set(null);
        this.fileError.set('');
        this.updateCalculations();
      }
    });
  }
}
