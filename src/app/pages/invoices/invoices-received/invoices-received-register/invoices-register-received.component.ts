import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {InvoicesReceivedService} from '../../../../core/services/invoices-received-services/invoices-received.service';
import {Router} from '@angular/router';
import Swal from 'sweetalert2';
import {HttpErrorResponse} from '@angular/common/http';
import {CurrencyPipe} from '@angular/common';
import {InvoicesUtilService} from '../../../../core/services/shared-services/invoices-Util.service';
import {Suppliers} from '../../../../interfaces/suppliers-interface';
import {SuppliersService} from '../../../../core/services/suppliers-services/suppliers.service';
import {CalculableInvoice} from '../../../../interfaces/calculate-interface';
import {FileUploadService} from '../../../../core/services/file-upload/file-upload.service';
import {
  CATEGORIES_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS
} from '../../../../shared/Collection-Enum/collection-enum';
import {InvoiceReceived} from '../../../../interfaces/invoices-received-interface';
import {ValidatorService} from '../../../../core/services/validator-services/validator.service';

/**
 * Componente para registrar nuevas facturas recibidas de proveedores.
 * Formulario ligero con campos esenciales y funcionalidad de archivos adjuntos.
 */
@Component({
  selector: 'app-invoices-received-register',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe
  ],
  templateUrl: './invoices-register-received.component.html',
  styleUrl: './invoices-register-received.component.css'
})
export class InvoicesRegisterReceivedComponent implements OnInit {

  // ==========================================
  // PROPIEDADES DE FORMULARIOS MÚLTIPLES
  // ==========================================

  // Información básica del proveedor y factura
  basicInfoForm: FormGroup;

  // Importes y cálculos fiscales
  amountsForm: FormGroup;

  // Categorización y descripción
  categoriesForm: FormGroup;

  // Estado y método de pago
  paymentForm: FormGroup;

  // Estado de envío
  isSubmitting: boolean = false;

  // ==========================================
  // PROPIEDADES DE DATOS
  // ==========================================

  // Lista de proveedores para el selector
  suppliers: Suppliers[] = [];

  // Total calculado automáticamente
  calculatedTotal: number = 0;

  // Mostrar campos de pago según el estado
  showPaymentFields: boolean = false;

  // ==========================================
  // PROPIEDADES DE ARCHIVOS
  // ==========================================

  // Archivo seleccionado
  selectedFile: File | null = null;

  // Estado de drag and drop
  isDragOver: boolean = false;

  // Error de archivo
  fileError: string = '';

  //LABELS PARA LOS NUEVOS CAMPOS DE PAGO
  paymentStatusLabels = PAYMENT_STATUS_LABELS;
  paymentMethodLabels = PAYMENT_METHOD_LABELS;
  categories = CATEGORIES_LABELS;

  constructor(
    private fb: FormBuilder,
    private invoicesReceivedService: InvoicesReceivedService,
    private router: Router,
    private invoicesUtilService: InvoicesUtilService,
    private suppliersServices: SuppliersService,
    private fileUploadService: FileUploadService,
    private validatorService: ValidatorService
  ) {
    // FormGroup para información básica
    this.basicInfoForm = this.fb.group({
      supplier_id: ['', [Validators.required]],
      invoice_number: ['', [Validators.required, Validators.minLength(3)]],
      invoice_date: ['', [Validators.required]],
      due_date: ['']
    });

    // FormGroup para importes y cálculos
    this.amountsForm = this.fb.group({
      tax_base: ['', [Validators.required, Validators.min(0.01)]],
      iva_percentage: [21, [Validators.min(0), Validators.max(100)]],
      irpf_percentage: [0, [Validators.min(0), Validators.max(100)]],
      total_amount: [0]
    });

    // FormGroup para categorización
    this.categoriesForm = this.fb.group({
      category: ['', [Validators.required]],
      subcategory: [''],
      description: ['', [Validators.required]]
    });

    // FormGroup para estado de pago
    this.paymentForm = this.fb.group({
      payment_status: ['pending'],
      payment_method: ['transfer'],
      payment_date: [''],
      payment_reference: ['']
    });

  }

  ngOnInit(): void {
    this.loadSuppliers();
    this.setDefaultDate();
    this.setupFormSubscriptions();
  }

  // ==========================================
  // MÉTODOS DE CONFIGURACIÓN
  // ==========================================
  /**
   * Configura las suscripciones reactivas para los FormGroups
   */
  setupFormSubscriptions(): void {
    // Suscripción para recalcular totales cuando cambian los importes
    this.amountsForm.valueChanges.subscribe(() => {
      this.calculateAmounts();
    });

    // Suscripción para mostrar/ocultar campos de pago
    this.paymentForm.get('payment_status')?.valueChanges.subscribe((status) => {
      this.handlePaymentStatusChange(status);
    });
  }

  // ==========================================
  // MÉTODOS DE CARGA DE DATOS
  // ==========================================

  /**
   * Carga la lista de proveedores activos
   */
  loadSuppliers(): void {
    this.suppliersServices.getAllSuppliers().subscribe({
      next: (suppliersList) => {
        this.suppliers = suppliersList;
      },
      error: (e: HttpErrorResponse) => {
        // error desde interceptores
      }
    });
  }

  /**
   * Establece la fecha actual como fecha de factura por defecto
   */
  setDefaultDate(): void {
    this.basicInfoForm.patchValue({
      invoice_date: this.invoicesUtilService.getCurrentDateForInput()
    });
  }

  // ==========================================
  // MÉTODOS DE VALIDACIÓN
  // ==========================================

  /**
   * Verifica si un campo es inválido para mostrar errores
   */
  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(formGroup: FormGroup, fieldName: string): string {
    return this.validatorService.getErrorMessage(formGroup, fieldName);
  }

  /**
   * Verifica si todos los formularios son válidos
   */
  areAllFormsValid(): boolean {
    return this.basicInfoForm.valid &&
      this.amountsForm.valid &&
      this.categoriesForm.valid &&
      this.paymentForm.valid;
  }

  // ==========================================
  // MÉTODOS DE CÁLCULO
  // ==========================================

  /**
   * Calcula automáticamente los importes cuando cambian los valores
   */
  calculateAmounts(): void {
    const amountsValues = this.amountsForm.value;

    const mockInvoice: CalculableInvoice = {
      tax_base: parseFloat(amountsValues.tax_base) || 0,
      iva: parseFloat(amountsValues.iva_percentage) || 0,
      irpf: parseFloat(amountsValues.irpf_percentage) || 0,
      is_proportional: 0
    };

    this.invoicesUtilService.calculateTotal(mockInvoice);

    this.calculatedTotal = mockInvoice.total || 0;
    this.amountsForm.patchValue({
      total_amount: this.calculatedTotal
    }, {emitEvent: false}); // Evitar loop infinito
  }

  // ==========================================
  // MÉTODOS DE ESTADO DE PAGO
  // ==========================================

  /**
   * Maneja el cambio de estado de pago para mostrar/ocultar campos adicionales
   */
  handlePaymentStatusChange(status: string): void {
    this.showPaymentFields = status === 'paid';

    // Si se marca como pagado, poner fecha actual
    if (this.showPaymentFields) {
      this.paymentForm.patchValue({
        payment_date: this.invoicesUtilService.getCurrentDateForInput()
      });
    } else {
      this.paymentForm.patchValue({
        payment_date: '',
        payment_reference: ''
      });
    }
  }

  // ==========================================
  // MÉTODOS DE MANEJO DE ARCHIVOS
  // ==========================================

  /**
   * Maneja el evento de drag over
   */
  onDragOver(event: DragEvent): void {
    this.fileUploadService.onDragOver(event);
    this.isDragOver = true;
  }

  /**
   * Maneja el evento de drag leave
   */
  onDragLeave(event: DragEvent): void {
    this.fileUploadService.onDragLeave(event);
    this.isDragOver = false;
  }

  /**
   * Maneja el evento de soltar archivo
   */
  onFileDrop(event: DragEvent): void {
    const file = this.fileUploadService.onFileDrop(event);
    this.isDragOver = false;

    if (file) {
      this.processFile(file);
    }
  }

  /**
   * Maneja la selección de archivo mediante input
   */
  onFileSelected(event: Event): void {
    const file = this.fileUploadService.onFileSelected(event);
    if (file) {
      this.processFile(file);
    }
  }

  /**
   * Procesa y valida el archivo seleccionado
   */
  processFile(file: File): void {
    // Usar el servicio para validar
    this.fileError = this.fileUploadService.validateFile(file);

    // Si no hay errores, asignar el archivo
    if (!this.fileError) {
      this.selectedFile = file;
    }
  }

  /**
   * Elimina el archivo seleccionado
   */
  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.fileError = '';
  }

  /**
   * Formatea el tamaño del archivo para mostrar
   */
  formatFileSize(bytes: number): string {
    return this.fileUploadService.formatFileSize(bytes);
  }

  // ==========================================
  // MÉTODOS DE ENVÍO
  // ==========================================

  /**
   * Procesa el envío del formulario
   */

  onSubmit(): void {
    if (this.areAllFormsValid() && !this.isSubmitting) {
      this.isSubmitting = true;

      this.validatorService.applyTransformations(this.basicInfoForm, 'invoice');
      this.validatorService.applyTransformations(this.categoriesForm, 'invoice');
      this.validatorService.applyTransformations(this.paymentForm, 'invoice');

      const formData = this.prepareFormData();

      this.invoicesReceivedService.createInvoiceReceived(formData, this.selectedFile || undefined).subscribe({
        next: () => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Factura registrada correctamente',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            this.router.navigate(['/dashboards/invoices-received/list']);
          });
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting = false;
        }
      });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      this.markAllFormsTouched();
    }
  }


  /**
   * Prepara los datos del formulario para envío al servidor
   */
  prepareFormData(): Partial<InvoiceReceived> {
    // Obtener valores de todos los FormGroups
    const basicValues = this.basicInfoForm.value;
    const amountsValues = this.amountsForm.value;
    const categoriesValues = this.categoriesForm.value;
    const paymentValues = this.paymentForm.value;

    // Calcular importes finales
    const taxBase = parseFloat(amountsValues.tax_base) || 0;
    const ivaPercentage = parseFloat(amountsValues.iva_percentage) || 0;
    const irpfPercentage = parseFloat(amountsValues.irpf_percentage) || 0;

    const ivaAmount = taxBase * (ivaPercentage / 100);
    const irpfAmount = taxBase * (irpfPercentage / 100);

    return {
      // Información básica
      supplier_id: parseInt(basicValues.supplier_id),
      invoice_number: basicValues.invoice_number.trim(),
      invoice_date: basicValues.invoice_date,
      due_date: basicValues.due_date || null,

      // Importes
      tax_base: taxBase,
      iva_percentage: ivaPercentage,
      iva_amount: ivaAmount,
      irpf_percentage: irpfPercentage,
      irpf_amount: irpfAmount,
      total_amount: this.calculatedTotal,

      // Categorización
      category: categoriesValues.category,
      subcategory: categoriesValues.subcategory?.trim() || null,
      description: categoriesValues.description.trim(),

      // Estado de pago (mapeo: del form payment_* a lo que el backend espera collection_*)
      collection_status: paymentValues.payment_status,
      collection_method: paymentValues.payment_method,
      collection_date: paymentValues.payment_date || null,
      collection_reference: paymentValues.payment_reference?.trim() || null,

      // Archivos
      has_attachments: this.selectedFile ? 1 : 0
    };
  };

  /**
   * Marca todos los campos de todos los formularios como tocados
   */
  markAllFormsTouched(): void {
    this.basicInfoForm.markAllAsTouched();
    this.amountsForm.markAllAsTouched();
    this.categoriesForm.markAllAsTouched();
    this.paymentForm.markAllAsTouched();
  };

  /**
   * Navega de vuelta al listado
   */
  goBack(): void {
    // Verificar si hay cambios sin guardar en cualquier formulario
    const hasChanges = this.basicInfoForm.dirty ||
      this.amountsForm.dirty ||
      this.categoriesForm.dirty ||
      this.paymentForm.dirty;

    if (hasChanges) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'Tienes cambios sin guardar que se perderán',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/dashboards/invoices-received/list']);
        }
      });
    } else {
      this.router.navigate(['/dashboards/invoices-received/list']);
    }
  }
}
