import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Suppliers} from '../../../../interfaces/suppliers-interface';
import {InvoicesReceivedService} from '../../../../core/services/invoices-received-services/invoices-received.service';
import {SuppliersService} from '../../../../core/services/suppliers-services/suppliers.service';
import {InvoicesUtilService} from '../../../../core/services/shared-services/invoices-Util.service';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {InvoiceReceived} from '../../../../interfaces/invoices-received-interface';
import {CalculableInvoice} from '../../../../interfaces/calculate-interface';
import Swal from 'sweetalert2';
import {CurrencyPipe} from '@angular/common';
import {FileUploadService} from '../../../../core/services/file-upload/file-upload.service';
import {
  CATEGORIES_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS
} from '../../../../shared/Collection-Enum/collection-enum';

@Component({
  selector: 'app-invoices-received-edit',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe
  ],
  templateUrl: './invoices-received-edit.component.html',
  styleUrl: './invoices-received-edit.component.css'
})
export class InvoicesReceivedEditComponent implements OnInit {

  // ==========================================
  // PROPIEDADES DE FORMULARIOS MÚLTIPLES
  // ==========================================

  // FormGroup principal
  mainForm: FormGroup;

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
  // PROPIEDADES DEL FORMULARIO------
  // ==========================================
  isLoading: boolean = false;

  // ID de la factura a editar
  invoiceId: number = 0;

  // Datos de la factura actual
  currentInvoice: InvoiceReceived | null = null

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
    private suppliersService: SuppliersService,
    private invoicesUtilService: InvoicesUtilService,
    private router: Router,
    private route: ActivatedRoute,
    private fileUploadService: FileUploadService
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


    // FormGroup principal que contiene todos los demás
    this.mainForm = this.fb.group({
      basicInfo: this.basicInfoForm,
      amounts: this.amountsForm,
      categories: this.categoriesForm,
      payment: this.paymentForm
    });
  }

  ngOnInit(): void {
    this.getInvoiceId();
    this.loadSuppliers();
    this.loadInvoiceData();

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

  /**
   * Obtiene el ID de la factura desde los parámetros de la ruta
   */
  getInvoiceId() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.invoiceId = parseInt(id, 10);
    } else {
      // Si no hay ID, redirigir al listado
      this.router.navigate(['/dashboards/invoices-received/list']);
    }
  }

  /**
   * Carga la lista de proveedores activos
   */
  loadSuppliers() {
    this.suppliersService.getAllSuppliers().subscribe({
      next: (suppliersList) => {
        this.suppliers = suppliersList;
      }, error: (e: HttpErrorResponse) => {
        // Error desde interceptores
      }
    });
  };

  /**
   * Carga los datos de la factura a editar
   */
  loadInvoiceData() {
    // Verificar que tenemos un ID válido
    if (!this.invoiceId || this.invoiceId <= 0) {
      console.error('No se pudo obtener el ID de la factura');
      this.router.navigate(['/dashboards/invoices-received/list']);
      return;
    }
    this.isLoading = true;

    this.invoicesReceivedService.getInvoiceById(this.invoiceId).subscribe({
      next: (invoices) => {
        this.currentInvoice = invoices;
        this.populateForm(invoices);
        this.calculateAmounts();
        this.isLoading = false;

      }, error: () => {
        this.isLoading = false;
        // Error desde interceptores
      }
    });
  };

  /**
   * Llena el formulario con los datos de la factura existente
   */
  populateForm(invoice: InvoiceReceived): void {
    // Llenar información básica
    this.basicInfoForm.patchValue({
      supplier_id: invoice.supplier_id || '',
      invoice_number: invoice.invoice_number || '',
      invoice_date: this.invoicesUtilService.formatDateForInput(invoice.invoice_date) || '',
      due_date: this.invoicesUtilService.formatDateForInput(invoice.due_date) || ''
    });

    // Llenar importes
    this.amountsForm.patchValue({
      tax_base: invoice.tax_base || '',
      iva_percentage: invoice.iva_percentage || 21,
      irpf_percentage: invoice.irpf_percentage || 0,
      total_amount: invoice.total_amount || 0
    });

    // Llenar categorización
    this.categoriesForm.patchValue({
      category: invoice.category || '',
      subcategory: invoice.subcategory || '',
      description: invoice.description || ''
    });

    // Llenar estado de pago (mapear collection_* a payment_*)
    this.paymentForm.patchValue({
      payment_status: invoice.collection_status || 'pending',
      payment_method: invoice.collection_method || 'transfer',
      payment_date: invoice.collection_date || '',
      payment_reference: invoice.collection_reference || ''
    });

    // Verificar si mostrar campos de pago
    this.showPaymentFields = invoice.collection_status === 'paid';
  };

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
  /**
   * Verifica si todos los formularios son válidos
   */
  areAllFormsValid(): boolean {
    return this.mainForm.valid &&
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
   * Procesa la actualización del formulario
   */
  onSubmit(): void {
    if (this.areAllFormsValid() && !this.isSubmitting) {
      this.isSubmitting = true;

      // Preparar datos para envío
      const formData = this.prepareFormData();

      // Enviar actualización al servidor
      this.invoicesReceivedService.updateInvoiceReceived(this.invoiceId, formData, this.selectedFile || undefined).subscribe({
        next: () => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Factura actualizada correctamente',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            this.router.navigate(['/dashboards/invoices-received/list']);
          });
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting = false;
          // Error manejado por interceptor
        }
      });
    } else {// Marcar todos los campos como tocados para mostrar errores

      this.markAllFormsTouched();
    }
  };

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
  }

  /**
   * Marca todos los campos de todos los formularios como tocados
   */
  markAllFormsTouched(): void {
    this.basicInfoForm.markAllAsTouched();
    this.amountsForm.markAllAsTouched();
    this.categoriesForm.markAllAsTouched();
    this.paymentForm.markAllAsTouched();
  }


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
