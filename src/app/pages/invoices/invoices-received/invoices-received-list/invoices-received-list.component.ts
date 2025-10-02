import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {CurrencyPipe, NgClass} from '@angular/common';
import Swal from 'sweetalert2';
import {DataFormatPipe} from '../../../../shared/pipe/data-format.pipe';
import {SearchService} from '../../../../core/services/shared-services/search.service';
import {PaginationService} from '../../../../core/services/shared-services/pagination.service';
import {PaginationConfig, PaginationResult} from '../../../../interfaces/pagination-interface';
import {InvoicesReceivedService} from '../../../../core/services/invoices-received-services/invoices-received.service';
import {InvoicesUtilService} from '../../../../core/services/shared-services/invoices-Util.service';
import {InvoiceReceived} from '../../../../interfaces/invoices-received-interface';
import {
  PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS
} from '../../../../shared/Collection-Enum/collection-enum';
import {ExportService} from '../../../../core/services/shared-services/exportar.service';
import {ExportableListBase} from '../../../../shared/Base/exportable-list.base';
import {Employee} from '../../../../interfaces/employee-interface';

/**
 * Componente para mostrar y gestionar la lista de facturas recibidas de proveedores.
 * Permite buscar, filtrar, crear, editar, eliminar y descargar facturas en PDF.
 * Gestiona también los estados de pago y la creación de abonos.
 */
@Component({
  selector: 'app-invoices-received-list',
  imports: [
    DataFormatPipe,
    ReactiveFormsModule,
    NgClass, CurrencyPipe
  ],
  templateUrl: './invoices-received-list.component.html',
  styleUrl: './invoices-received-list.component.css'
})
export class InvoicesReceivedListComponent extends ExportableListBase<InvoiceReceived> implements OnInit {

  // ==========================================
  // PROPIEDADES DE FORMULARIOS MÚLTIPLES
  // ==========================================

  // FormGroup para búsqueda de texto
  searchForm: FormGroup;

  //todos los filtos
  filtersForm: FormGroup;

  // FormGroup para configuración de paginación
  paginationForm: FormGroup;

  // Sección de edición inline
  editPaymentForm: FormGroup | null = null;

  // Sección de modal
  refundForm: FormGroup;

  // ==========================================
  // PROPIEDADES DE DATOS
  // ==========================================

  // Lista de facturas que se muestra en la tabla
  invoices: InvoiceReceived[] = [];

  // Lista completa de facturas (datos originales sin filtrar)
  allInvoices: InvoiceReceived[] = [];

  // Lista de facturas filtradas (antes de paginar)
  filteredInvoices: InvoiceReceived[] = [];

  // ==========================================
  // PROPIEDADES DE FILTROS Y BÚSQUEDA
  // ==========================================

  // Categorías extraídas dinámicamente de las facturas
  categoryOptions: string[] = [];

  // Proveedores extraídos dinámicamente de las facturas
  suppliersOptions: string[] = [];

  //Opciones de filtro para abonos
  refundStatusOptions: { value: string, label: string }[] = [];
  //========================================
  //LABELS PARA LOS NUEVOS CAMPOS DE PAGO
  //========================================
  paymentStatusLabels = PAYMENT_STATUS_LABELS;
  paymentMethodLabels = PAYMENT_METHOD_LABELS;


  // ==========================================
  // PROPIEDADES DE PAGINACIÓN
  // ==========================================

  // Configuración de paginación
  paginationConfig: PaginationConfig = {
    currentPage: 1,
    itemsPerPage: 5,
    totalItems: 0
  };

  // Resultado de paginación
  paginationResult: PaginationResult<InvoiceReceived> = {
    items: [],
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
    startIndex: 0,
    endIndex: 0
  };

  // ==========================================
  // PROPIEDADES DE MODALES Y EDICIÓN
  // ==========================================

  // Datos temporales para edición rápida de pagos
  editingPayment: Set<number> = new Set();

  // Control de visibilidad del modal de abonos
  showRefundModal: boolean = false;

  // Factura seleccionada para crear abono
  selectedInvoice: InvoiceReceived | null = null;

  //===============================
  // FUNCIONES PARA LA EXPORTACION
  //===============================
  // Implementar propiedades abstractas
  entityName = 'facturas-recibidas'; //para nombrar los documentos descargados
  selectedItems: Set<number> = new Set();

  readonly exportColumns = [
    {key: 'id', title: 'ID', width: 10},
    {key: 'invoice_number', title: 'Nº Factura', width: 15},
    {key: 'our_reference', title: 'Referencia', width: 15},
    {key: 'supplier_name', title: 'Proveedor', width: 25},
    {key: 'invoice_date', title: 'Fecha Factura', width: 12},
    {key: 'due_date', title: 'Fecha Vencimiento', width: 12},
    {key: 'tax_base', title: 'Base', width: 12, formatter: (value: unknown) => value ? `${value} €` : '-'},
    {key: 'iva_percentage', title: 'IVA (%)', width: 10},
    {key: 'irpf_percentage', title: 'IRPF (%)', width: 10},
    {key: 'total_amount', title: 'Total', width: 12, formatter: (value: unknown) => value ? `${value} €` : '-'},
    {key: 'category', title: 'Categoría', width: 20},
    {key: 'collection_status', title: 'Estado Pago', width: 15},
    {key: 'is_refund', title: 'Tipo', width: 12, formatter: (value: unknown) => value ? 'Abono' : 'Factura Normal'}
  ];

  constructor(
    private invoicesReceivedService: InvoicesReceivedService,
    private router: Router,
    private searchService: SearchService,
    private paginationService: PaginationService,
    protected invoicesUtilService: InvoicesUtilService,
    private fb: FormBuilder,
    public exportService: ExportService,
  ) {
    super();
    // FormGroup para búsqueda
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });

    // Todos los filtros en uno solo
    this.filtersForm = this.fb.group({
      selectedPaymentStatus: [''],
      selectedRefundStatus: [''],
      selectedCategory: [''],
      selectedSupplier: ['']
    });

    // FormGroup para paginación
    this.paginationForm = this.fb.group({
      itemsPerPage: [5]
    });

    // FormGroup para modal de abonos
    this.refundForm = this.fb.group({
      refundReason: ['', Validators.required]
    });
  }

  // Implementar métodos abstractos
  getFilteredData(): InvoiceReceived[] {
    return this.filteredInvoices;
  }

  getCurrentPageData(): InvoiceReceived[] {
    return this.invoices;
  }

  getPaginationConfig(): PaginationConfig {
    return this.paginationConfig;
  }


  /**
   * Se ejecuta al cargar el componente.
   * Carga la lista de facturas automáticamente.
   */
  ngOnInit(): void {
    this.getListInvoices();
    this.setupFormSubscriptions();

  }

  /**
   * Configura las suscripciones reactivas para los FormGroups
   */
  setupFormSubscriptions(): void {
    // Suscripción para búsqueda en tiempo real
    this.searchForm.get('searchTerm')?.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    // Suscripción para cambios en filtros
    this.filtersForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    this.paginationForm.get('itemsPerPage')?.valueChanges.subscribe((items) => {
      this.paginationConfig.itemsPerPage = items;
      this.paginationConfig.currentPage = 1;
      this.updatePagination();
    });

  }

  // ==========================================
  // MÉTODOS DE CARGA DE DATOS
  // ==========================================

  /**
   * Obtiene todas las facturas recibidas del servidor.
   * Guarda una copia original para los filtros de búsqueda.
   */
  getListInvoices(): void {
    this.invoicesReceivedService.getAllInvoicesReceived().subscribe({
      next: (invoicesList) => {
        this.allInvoices = invoicesList;
        this.extractFilterOptions();
        this.applyFilters();
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  // ==========================================
  // MÉTODOS DE FILTROS Y BÚSQUEDA
  // ==========================================

  /**
   * Extrae las opciones únicas para todos los filtros basándose en los datos cargados.
   */
  extractFilterOptions(): void {

    // Extraer categorías únicas
    const categories = this.allInvoices
      .map((invoice: InvoiceReceived) => invoice.category)
      .filter(Boolean) // Elimina undefined, null, '', etc.
      .filter((category, index, array) => array.indexOf(category) === index)
      .sort() as string[];
    this.categoryOptions = categories;

    // Extraer proveedores únicos
    const suppliers = this.allInvoices
      .map((invoice: InvoiceReceived) => invoice.supplier_name)
      .filter((supplier): supplier is string => !!supplier)
      .filter((supplier, index, array) => supplier && array.indexOf(supplier) === index)
      .sort();
    this.suppliersOptions = suppliers;

    // Extraer opciones de abonos
    this.refundStatusOptions = [
      {value: 'true', label: 'Abono'},
      {value: 'false', label: 'Factura Normal'}
    ];
  }

  /**
   * Aplica todos los filtros activos a la lista de facturas.
   */
  applyFilters(): void {
    let filtered = [...this.allInvoices];

    const search = this.searchForm.get('searchTerm')?.value;
    const paymentStatus = this.filtersForm.get('selectedPaymentStatus')?.value;
    const refundStatus = this.filtersForm.get('selectedRefundStatus')?.value;
    const category = this.filtersForm.get('selectedCategory')?.value;
    const supplier = this.filtersForm.get('selectedSupplier')?.value;

    if (search?.trim()) {
      filtered = this.searchService.filterData(
        filtered, search,
        ['invoice_number', 'our_reference', 'supplier_name', 'category']);
    }

    if (paymentStatus) {
      filtered = filtered.filter(invoice => invoice.collection_status === paymentStatus);
    }

    if (category) {
      filtered = filtered.filter(invoice => invoice.category === category);
    }

    if (supplier) {
      filtered = filtered.filter(invoice => invoice.supplier_name === supplier);
    }

    if (refundStatus !== '') {
      const isRefund = refundStatus === 'true';
      filtered = filtered.filter(invoice => Boolean(invoice.is_refund) === isRefund);
    }

    this.filteredInvoices = filtered;
    this.paginationConfig.totalItems = filtered.length;
    this.paginationConfig.currentPage = 1;
    this.updatePagination();
  }

  /**
   * Limpia todos los filtros y muestra todas las facturas.
   */
  clearFilters(): void {
    // Resetear cada FormGroup por separado con valores explícitos
    this.searchForm.patchValue({
      searchTerm: ''
    });
    this.filtersForm.patchValue({
      selectedPaymentStatus: '',
      selectedRefundStatus: '',
      selectedCategory: '',
      selectedSupplier: ''
    })
  }

  // ========================
  // MÉTODOS DE PAGINACIÓN
  // ========================

  /**
   * Actualiza la paginación con los datos filtrados.
   */
  updatePagination(): void {
    this.paginationResult = this.paginationService.paginate(
      this.filteredInvoices,
      this.paginationConfig
    );
    this.invoices = this.paginationResult.items;
  }

  /**
   * Navega a una página específica.
   */
  goToPage(page: number): void {
    if (this.paginationService.isValidPage(page, this.paginationResult.totalPages)) {
      this.paginationConfig.currentPage = page;
      this.updatePagination();
    }
  }

  /**
   * Navega a la página anterior.
   */
  previousPage(): void {
    if (this.paginationResult.hasPrevious) {
      this.goToPage(this.paginationConfig.currentPage - 1);
    }
  }

  /**
   * Navega a la página siguiente.
   */
  nextPage(): void {
    if (this.paginationResult.hasNext) {
      this.goToPage(this.paginationConfig.currentPage + 1);
    }
  }

  /**
   * Obtiene las páginas visibles para la navegación.
   */
  getVisiblePages(): number[] {
    return this.paginationService.getVisiblePages(
      this.paginationConfig.currentPage,
      this.paginationResult.totalPages,
      5
    );
  }

  /**
   * Obtiene el texto informativo de paginación.
   */
  getPaginationText(): string {
    return this.paginationService.getPaginationText(
      this.paginationConfig,
      this.invoices.length
    );
  }

  // ==========================================
  // MÉTODOS DE NAVEGACIÓN Y CRUD
  // ==========================================

  /**
   * Navega a la página de registro de nueva factura recibida.
   */
  createNewInvoice(): void {
    this.router.navigate(['/dashboards/invoices-received/register']);
  }

  /**
   * Navega a la página de edición de factura recibida.
   */
  editInvoice(id: number) {
    this.router.navigate(['/dashboards/invoices-received/edit', id]);
  }

  /**
   * Elimina una factura recibida después de confirmar la acción.
   */
  deleteInvoice(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.invoicesReceivedService.deleteInvoiceReceived(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminada',
              text: 'La factura fue eliminada correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
            this.getListInvoices();
          },
          error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        });
      }
    });
  }

  // ==========================================
  // MÉTODOS DE GESTIÓN DE PAGOS
  // ==========================================

  /**
   * Prepara los datos para editar el pago de una factura.
   */
  startEditingPayment(invoice: InvoiceReceived): void {

    // Crear FormGroup dinámico para esta factura
    this.editPaymentForm = this.fb.group({
      collection_status: [invoice.collection_status || 'pending'],
      collection_method: [invoice.collection_method || 'transfer'],
      collection_date: [invoice.collection_date || ''],
      collection_reference: [invoice.collection_reference || ''],
      collection_notes: [invoice.collection_notes || '']
    });
    this.editingPayment.add(invoice.id!);
  };


  /**
   * Cancela la edición del pago.
   */
  cancelEditingPayment(invoiceId: number): void {
    this.editingPayment.delete(invoiceId);
    this.editPaymentForm = null; // Destruir FormGroup
  }

  /**
   * Verifica si una factura está en modo edición de pago.
   */
  isEditingPayment(invoiceId: number): boolean {
    return this.editingPayment.has(invoiceId);
  }

  /**
   * Guarda los cambios del estado de pago.
   */
  savePaymentChanges(invoiceId: number): void {
    if (!this.editPaymentForm || this.editPaymentForm.invalid) {
      return;
    }

    const formValues = this.editPaymentForm.value;

    // Validación: Si se marca como pagada, debe tener fecha
    if (formValues.collection_status === 'paid' && !formValues.collection_date) {
      Swal.fire({
        title: 'Error',
        text: 'Las facturas marcadas como pagadas deben tener una fecha de pago',
        icon: 'error'
      });
      return;
    }

    // Llamar al servicio para actualizar
    this.invoicesReceivedService.updatePaymentStatus(invoiceId, formValues).subscribe({
      next: (response) => {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Estado de pago actualizado correctamente',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

        // Limpiar edición y recargar lista
        this.editingPayment.delete(invoiceId);
        this.editPaymentForm = null;
        this.getListInvoices();
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  /**
   * Cambio rápido de estado pendiente/pagado.
   */
  togglePaymentStatus(invoice: InvoiceReceived): void {
    const newStatus = invoice.collection_status === 'paid' ? 'pending' : 'paid';

    const paymentData: {
      collection_status: 'pending' | 'paid' | 'overdue' | 'disputed';
      collection_method: 'transfer' | 'direct_debit' | 'cash' | 'card' | 'check';
      collection_date?: string;
      collection_reference?: string;
      collection_notes?: string;
    } = {
      collection_status: newStatus,
      collection_method: invoice.collection_method || 'transfer',
      collection_date: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : undefined,
      collection_reference: invoice.collection_reference,
      collection_notes: invoice.collection_notes
    };
    this.invoicesReceivedService.updatePaymentStatus(invoice.id!, paymentData).subscribe({
      next: (response) => {
        // Actualizar localmente para respuesta inmediata
        invoice.collection_status = newStatus;
        invoice.collection_date = paymentData.collection_date;

        const statusText = newStatus === 'paid' ? 'pagado' : 'pendiente';
        Swal.fire({
          title: '¡Actualizado!',
          text: `Factura marcada como ${statusText}`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  // ==========================================
  // MÉTODOS DE ABONOS
  // ==========================================

  /**
   * Abre el modal para registrar un abono.
   */
  openRefundModal(invoice: InvoiceReceived): void {
    this.selectedInvoice = invoice;
    this.showRefundModal = true;

    // Preparar datos del nuevo abono
    this.refundForm.patchValue({
      refundReason: ''
    })

  }

  /**
   * Cierra el modal de abonos.
   */
  closeRefundModal(): void {
    this.showRefundModal = false;
    this.selectedInvoice = null;
    this.refundForm.reset(); //esto para limpiar el formulario
  }

  /**
   * Guarda el nuevo abono.
   */
  saveRefund(): void {
    // Usar FormGroup para validación
    if (this.refundForm.invalid) {
      this.refundForm.markAllAsTouched(); // Mostrar errores
      Swal.fire({
        title: 'Error',
        text: 'El motivo del abono es obligatorio',
        icon: 'error'
      });
      return;
    }

    //Obtener valor del FormGroup
    const refundReason = this.refundForm.get('refundReason')?.value;
    // Crear el abono
    this.invoicesReceivedService.createRefund(
      this.selectedInvoice?.id!,
      refundReason // ← Usar valor del FormGroup
    ).subscribe({
      next: (data) => {
        Swal.fire({
          title: 'Éxito!',
          text: 'Abono registrado correctamente',
          icon: 'success'
        });
        this.closeRefundModal();
        this.getListInvoices();
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  // ==========================================
  // MÉTODOS DE DESCARGA PDF
  // ==========================================

  /**
   * Descarga una factura recibida en formato PDF.
   */
  downloadPdf(invoiceId: number): void {
    const invoice = this.invoices.find(inv => inv.id === invoiceId);
    const isRefund = invoice?.is_refund;

    Swal.fire({
      title: 'Generando PDF...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    let downloadMethod;
    if (isRefund) {
      downloadMethod = this.invoicesReceivedService.downloadRefundInvoicePdf(invoiceId);
    } else {
      downloadMethod = this.invoicesReceivedService.downloadInvoicePdf(invoiceId);
    }

    downloadMethod.subscribe({
      next: (pdfBlob) => {
        Swal.close();
        if (pdfBlob.size === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Archivo vacío',
            text: 'El PDF generado está vacío'
          });
          return;
        }

        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;

        const fileName = isRefund
          ? `abono-recibido-${invoice?.invoice_number || invoiceId}.pdf`
          : `factura-recibida-${invoice?.invoice_number || invoiceId}.pdf`;
        link.download = fileName;

        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 100);

        Swal.fire({
          icon: 'success',
          title: '¡Descarga exitosa!',
          text: `${isRefund ? 'Abono' : 'Factura'} ${invoice?.invoice_number || invoiceId} descargada`,
          timer: 2000,
          showConfirmButton: false
        });

      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  /**
   * Descarga el archivo adjunto de una factura con autenticación
   */
  viewAttachment(invoice: InvoiceReceived): void {
    if (!invoice.has_attachments || !invoice.pdf_path) {
      Swal.fire({
        title: 'Sin archivo',
        text: 'Esta factura no tiene archivo adjunto',
        icon: 'info'
      });
      return;
    }
    // Mostrar loading
    Swal.fire({
      title: 'Cargando archivo...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Usar el servicio HTTP con autenticación
    this.invoicesReceivedService.downloadAttachment(invoice.pdf_path).subscribe({
      next: (blob) => {
        Swal.close();

        // Crear URL temporal para visualizar
        const url = window.URL.createObjectURL(blob);

        // Abrir en nueva pestaña para visualizar (no descargar)
        window.open(url, '_blank');

        // Limpiar URL temporal después de un tiempo
        setTimeout(() => window.URL.revokeObjectURL(url), 10000); // 10 segundos
      },
      error: (error) => {
        Swal.close();
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar el archivo',
          icon: 'error'
        });
      }
    });
  }

}
