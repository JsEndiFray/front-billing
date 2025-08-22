import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Invoice, RefundInvoice} from '../../../../interfaces/invoices-issued-interface';
import {DataFormatPipe} from '../../../../shared/pipe/data-format.pipe';
import {InvoicesIssuedService} from '../../../../core/services/invoices-issued-service/invoices-issued.service';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {NgClass} from '@angular/common';
import {SearchService} from '../../../../core/services/shared-services/search.service';
import Swal from 'sweetalert2';
import {CommonModule} from '@angular/common';
import {PaginationConfig, PaginationResult} from '../../../../interfaces/pagination-interface';
import {PaginationService} from '../../../../core/services/shared-services/pagination.service';
import {
  InvoicesUtilService
} from '../../../../core/services/shared-services/invoices-Util.service';
import {
  BILLING_TYPE_LABELS,
  CATEGORIES_LABELS,
  COLLECTION_METHOD_LABELS, COLLECTION_STATUS_LABELS,
} from '../../../../shared/Collection-Enum/collection-enum';


/**
 * Componente para mostrar y gestionar la lista de facturas
 * Permite buscar, crear, editar, eliminar y descargar facturas en PDF
 */
@Component({
  selector: 'app-invoices-issued-list',
  imports: [
    DataFormatPipe,
    ReactiveFormsModule,
    NgClass,
    CommonModule,
  ],
  templateUrl: './invoices-issued-list.component.html',
  styleUrl: './invoices-issued-list.component.css'
})
export class InvoicesIssuedListComponent implements OnInit {

  // ==========================================
  // PROPIEDADES DE FORMULARIOS MÚLTIPLES
  // ==========================================

  // FormGroup para búsqueda de texto
  searchForm: FormGroup;

  //Formulario para filtros de búsqueda
  filtersForm: FormGroup;

  // FormGroup para configuración de paginación
  paginationForm: FormGroup;

  // Formulario para edición de pagos (no usado actualment
  editCollectionForm: FormGroup | null = null;

  // Formulario para modal de abonos
  refundForm: FormGroup;

  // ==========================================
  // PROPIEDADES DE DATOS
  // ==========================================

  // Lista de facturas que se muestra en la tabla
  invoices: Invoice[] = [];

  // Lista completa de facturas (datos originales sin filtrar)
  allInvoices: Invoice[] = [];

  // Lista de clientes filtrados (antes de paginar)
  filteredInvoices: Invoice[] = [];

  // ==========================================
  // PROPIEDADES DE FILTROS Y BÚSQUEDA
  // ==========================================
//Extrae los meses o porporcionales unicos
  billingTypeOptions: Array<0 | 1> = [];
  //Extrae propietarios unicos
  ownersOptions: string[] = [];
  //Extrae clientes unicos
  clientsOptions: string[] = [];
  //Extrae facturas de abono unicos
  refundStatusOptions: { value: string, label: string }[] = [];

  //========================================
  //LABELS PARA LOS NUEVOS CAMPOS DE COBROS
  //========================================
  collectionStatusLabels = COLLECTION_STATUS_LABELS;
  collectionMethodLabels = COLLECTION_METHOD_LABELS;
  billingTypeLabels = BILLING_TYPE_LABELS;

  // ==========================================
  // PROPIEDADES DE PAGINACIÓN
  // ==========================================

  paginationConfig: PaginationConfig = {
    currentPage: 1,
    itemsPerPage: 5,
    totalItems: 0
  };

// Resultado de paginación
  paginationResult: PaginationResult<Invoice> = {
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

  //Datos temporales para edición rápida - AHORA USA INVOICE
  editingCollection: { [invoiceId: number]: Partial<Invoice> } = {};

  // Variables para el modal de abonos
  showRefundModal: boolean = false;

  // Factura seleccionada para crear abono
  selectedInvoice: Invoice | null = null;

  // Datos del nuevo abono
  newRefund: {
    originalInvoiceId: number;
  } = {
    originalInvoiceId: 0
  };


  constructor(
    private invoicesIssuedService: InvoicesIssuedService,
    private invoicesIssuedUtilService: InvoicesUtilService,
    private router: Router,
    private searchService: SearchService,
    private paginationService: PaginationService,
    private fb: FormBuilder
  ) {

    // FormGroup para búsqueda
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });

    this.filtersForm = this.fb.group({
      selectedCollectionStatus: [''],
      selectedRefundStatus: [''],
      selectedOwners: [''],
      selectedClients: [''],
      selectedTypeBilling: [''],
    });

    // FormGroup para paginación
    this.paginationForm = this.fb.group({
      itemsPerPage: [5],
      currentPage: [1]
    });

    //FormGroup para modal de abonos
    this.refundForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      invoice_date: ['', [Validators.required]],
      collection_method: ['transfer'],
      concept: ['']
    });
  }

  /**
   * Se ejecuta al cargar el componente
   * Carga la lista de facturas automáticamente
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
  // MÉTODOS HELPER PARA ETIQUETAS
  // ==========================================
  getStatusLabel(status: string): string {
    return COLLECTION_STATUS_LABELS.find(item => item.value === status)?.label || status;
  }

  getMethodLabel(method: string): string {
    return COLLECTION_METHOD_LABELS.find(item => item.value === method)?.label || method;
  }

  getCategoryLabel(category: string): string {
    return CATEGORIES_LABELS.find(item => item.value === category)?.label || category;
  }

  // ==========================================
  // MÉTODOS DE CARGA DE DATOS
  // ==========================================


  /**
   * Obtiene todas las facturas del servidor
   * Guarda una copia original para los filtros de búsqueda
   */
  getListInvoices() {
    this.invoicesIssuedService.getAllInvoicesIssued().subscribe({
      next: (invoicesList) => {
        this.allInvoices = invoicesList;
        this.extractFilterOptions();
        this.applyFilters();
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  }

  // ==========================================
  // MÉTODOS DE FILTROS Y BÚSQUEDA
  // ==========================================

  /**
   * Extrae todos los filtos
   */
  extractFilterOptions() {

    //Extrae los meses o porporcionales unicos
    this.billingTypeOptions = [0, 1];

    //Extrae propietarios unicos
    const owners = this.allInvoices
      .map(invoice => invoice.owner_name)
      .filter((owner): owner is string => !!owner)
      .filter((owner, index, array) => owner && array.indexOf(owner) === index)
      .sort();
    this.ownersOptions = owners;

    //Extrae clientes unicos
    const clients = this.allInvoices
      .map(invoice => invoice.client_name)
      .filter((client): client is string => !!client)
      .filter((client, index, array) => client && array.indexOf(client) === index)
      .sort();
    this.clientsOptions = clients;

    //Extrae facturas de abono unicos
    this.refundStatusOptions = [
      {value: '1', label: 'Abono'},
      {value: '0', label: 'Factura'}
    ];
  }

  /**
   * Filtra la lista de facturas según el texto de búsqueda
   * Busca en: número de factura, ID de propiedad, ID de cliente, ID de propietario, mes correspondencia
   */
  applyFilters(): void {
    let filtered = [...this.allInvoices];

    const search = this.searchForm.get('searchTerm')?.value;
    const collectionStatus = this.filtersForm.get('selectedCollectionStatus')?.value;
    const refundStatus = this.filtersForm.get('selectedRefundStatus')?.value;
    const owners = this.filtersForm.get('selectedOwners')?.value;
    const clients = this.filtersForm.get('selectedClients')?.value;
    const typeBilling = this.filtersForm.get('selectedTypeBilling')?.value;

    // Filtro por búsqueda de texto
    if (search.trim()) {
      filtered = this.searchService.filterData(
        filtered, search,
        ['invoice_number', 'estates_id', 'clients_id', 'owners_id', 'corresponding_month', 'estate_name', 'client_name', 'owner_name']
      );
    }

    // Filtro por estado de pagos
    if (collectionStatus) {
      filtered = filtered.filter(invoice => invoice.collection_status === collectionStatus);
    }
    // Tipo de factura o de abono
    if (refundStatus) {
      filtered = filtered.filter(invoice => invoice.is_refund === Number(refundStatus));
    }

    // Filtro facturas por propietarios
    if (owners) {
      filtered = filtered.filter(invoice => invoice.owner_name === owners);
    }

    // Filtro facturas por clientes
    if (clients) {
      filtered = filtered.filter(invoice => invoice.client_name === clients);
    }


    // Filtro por mes o proporcional
    if (typeBilling) {
      filtered = filtered.filter(invoice => invoice.is_proportional === Number(typeBilling));
    }

    this.filteredInvoices = filtered;
    this.paginationConfig.totalItems = filtered.length;
    this.paginationConfig.currentPage = 1;
    this.updatePagination();
  }
  /**
   * Limpia el filtro de búsqueda
   */
  clearSearch(): void {
    this.searchForm.patchValue({
      searchTerm: ''
    });
  }


  /**
   * Limpia el filtro de búsqueda y muestra todas las facturas
   */
  clearFilters():void {
    // Resetear cada FormGroup por separado con valores explícitos
    this.searchForm.patchValue({
      searchTerm: ''
    });

    this.filtersForm.patchValue({
      selectedCollectionStatus: '',
      selectedRefundStatus: '',
      selectedOwners: '',
      selectedClients: '',
      selectedTypeBilling: ''  // Asegurarse que sea string vacío, no null
    });
  }

  // ========================
  // MÉTODOS DE PAGINACIÓN
  // ========================
  /**
   * Actualiza la paginación con los datos filtrados
   */
  updatePagination() {
    this.paginationResult = this.paginationService.paginate(
      this.filteredInvoices,
      this.paginationConfig
    );
    this.invoices = this.paginationResult.items;
  }

  /**
   * Navega a una página específica
   */
  goToPage(page: number) {
    if (this.paginationService.isValidPage(page, this.paginationResult.totalPages)) {
      this.paginationConfig.currentPage = page;
      this.updatePagination();
    }
  }

  /**
   * Navega a la página anterior
   */
  previousPage() {
    if (this.paginationResult.hasPrevious) {
      this.goToPage(this.paginationConfig.currentPage - 1);
    }
  };

  /**
   * Navega a la página siguiente
   */
  nextPage() {
    if (this.paginationResult.hasNext) {
      this.goToPage(this.paginationConfig.currentPage + 1);
    }
  }

  /**
   * Obtiene las páginas visibles para la navegación
   */
  getVisiblePages(): number[] {
    return this.paginationService.getVisiblePages(
      this.paginationConfig.currentPage,
      this.paginationResult.totalPages,
      5
    );
  }

  /**
   * Obtiene el texto informativo de paginación
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
   * Navega a la página de registro de nueva factura
   */
  createNewInvoice() {
    this.router.navigate(['/dashboards/invoices-issued/register']);
  }

  /**
   * Navega a la página de edición de factura
   */
  editInvoice(id: number) {
    this.router.navigate(['/dashboards/invoices-issued/edit', id]);
  }
  /**
   * Exporta los datos filtrados
   */
  exportData() {
    // Implementar lógica de exportación aquí
    console.log('Exportando datos:', this.allInvoices);
  }

  /**
   * Elimina una factura después de confirmar la acción
   */
  deleteInvoice(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.invoicesIssuedService.deleteInvoice(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado.',
              text: 'La factura fue eliminada correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
            this.getListInvoices();
          }, error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        })
      }
    })
  }

  // ==========================================
  // MÉTODOS DE GESTIÓN DE COBROS
  // ==========================================
  /**
   * Prepara los datos para editar el cobro de una factura
   */
  startEditingCollection(invoice: Invoice): void {

    // Crear FormGroup dinámico para esta factura específica
    this.editCollectionForm = this.fb.group({
      collection_status: [invoice.collection_status || 'pending'],
      collection_method: [invoice.collection_method || 'transfer'],
      collection_date: [invoice.collection_date || ''],
      collection_notes: [invoice.collection_notes || ''],
      collection_reference: [invoice.collection_reference || '']
    });

    // Mantener referencia simple para saber qué factura se está editando
    this.editingCollection[invoice.id!] = {id: invoice.id};
  }

  /**
   * Cancela la edición del cobro
   */
  cancelEditingCollection(invoiceId: number): void {
    delete this.editingCollection[invoiceId];
    this.editCollectionForm = null; // Destruir FormGroup
  }

  /**
   * Verifica si una factura está en modo edición de cobro
   */
  isEditingCollection(invoiceId: number): boolean {
    return !!this.editingCollection[invoiceId];
  }

  /**
   * Guarda los cambios del estado de cobro
   */
  saveCollectionChanges(invoiceId: number): void {
    if (!this.editCollectionForm || this.editCollectionForm.invalid) {
      return;
    }

    const formValues = this.editCollectionForm.value;

    // Validación: Si se marca como cobrado, debe tener fecha
    if (formValues.collection_status === 'collected' && !formValues.collection_date) {
      Swal.fire({
        title: 'Error',
        text: 'Las facturas cobradas deben tener una fecha de cobro',
        icon: 'error'
      });
      return;
    }

    // Llamar al servicio para actualizar
    this.invoicesIssuedService.updateCollectionStatus(invoiceId, formValues).subscribe({
      next: (updatedInvoice) => {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Estado de cobro actualizado correctamente',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

        // Limpiar edición y recargar lista
        delete this.editingCollection[invoiceId];
        this.editCollectionForm = null;
        this.getListInvoices();
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  /**
   * Cambio rápido de estado pendiente/cobrado
   */
  toggleCollectionStatus(invoice: Invoice) {
    const newStatus = invoice.collection_status === 'collected' ? 'pending' : 'collected';

    const collectionData: {
      collection_status: 'pending' | 'collected' | 'overdue' | 'disputed';
      collection_method: 'transfer' | 'direct_debit' | 'cash' | 'card' | 'check';
      collection_date?: string;
      collection_reference?: string;
      collection_notes?: string;
    }={
      collection_status: newStatus,
      collection_method: invoice.collection_method || 'transfer',
      collection_date: newStatus === 'collected' ? new Date().toISOString().split('T')[0] : undefined,
      collection_reference: invoice.collection_reference,
      collection_notes: invoice.collection_notes
    };
    this.invoicesIssuedService.updateCollectionStatus(invoice.id!, collectionData).subscribe({
      next: () => {
        invoice.collection_status = newStatus;
        invoice.collection_date = collectionData.collection_date;
        invoice.collection_reference = collectionData.collection_reference;
        invoice.collection_notes = collectionData.collection_notes;

        const statusText = newStatus === 'collected' ? 'cobrado' : 'pendiente';
        Swal.fire({
          title: '¡Actualizado!',
          text: `Factura marcada como ${statusText}`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (e: HttpErrorResponse) => {
      }
    });
  };

  // ==========================================
  // ABONOS (MODAL Y CREACIÓN)
  // ==========================================

  /**
   * Abre el modal para registrar un abono
   */
  openRefundModal(invoice: Invoice): void {
    this.selectedInvoice = invoice;
    this.showRefundModal = true;

    // Preparar datos en el FormGroup
    this.refundForm.patchValue({
      amount: 0,
      invoice_date: new Date().toISOString().split('T')[0],
      collection_method: 'transfer',
      concept: ''
    });
    // Solo mantener el ID fuera del FormGroup
    this.newRefund.originalInvoiceId = invoice.id!;
  }

  /**
   * Cierra el modal de abonos
   */
  closeRefundModal() {
    this.showRefundModal = false;
    this.selectedInvoice = null;
    this.refundForm.reset();
  }

  /**
   * Guarda el nuevo abono
   */
  /**
   * Guarda el nuevo abono
   */
  saveRefund(): void {
    if (this.refundForm.invalid) {
      this.refundForm.markAsTouched(); // Mostrar errores
      Swal.fire({
        title: 'Error',
        text: 'El motivo del abono es obligatorio',
        icon: 'error'
      });
      return;
    }

    const formValues = this.refundForm.value;

    // Crear objeto RefundInvoice con datos del FormGroup
    const refundData: RefundInvoice = {
      originalInvoiceId: this.newRefund.originalInvoiceId,
      invoice_date: formValues.invoice_date,
      amount: parseFloat(formValues.amount),
      concept: formValues.concept?.trim() || '',
      collection_method: formValues.collection_method
    };

    // Crear el abono
    this.invoicesIssuedService.createRefund(refundData).subscribe({
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

  /**
   * Descarga una factura en formato PDF
   */
  downloadPdf(invoiceId: number) {
    const invoice = this.invoices.find(inv => inv.id === invoiceId);
    const isRefund = invoice?.is_refund === 1;

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
      downloadMethod = this.invoicesIssuedService.downloadRefundInvoicePdf(invoiceId);
    } else {
      downloadMethod = this.invoicesIssuedService.downloadInvoicePdf(invoiceId);
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

        const fileName = isRefund ? `abono-${invoice?.invoice_number || invoiceId}.pdf` : `factura-${invoice?.invoice_number || invoiceId}.pdf`;
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

      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }


  // ==========================================
  // GETTERS PARA TEMPLATE
  // ==========================================
  get invoiceUtilsService() {
    return this.invoicesIssuedUtilService;
  }

  /**
   * Getter para obtener el valor del campo de búsqueda
   */
  get searchTerm(): string {
    return this.searchForm.get('searchTerm')?.value || '';
  }







  get collectionStatusControl() {
    return this.editCollectionForm?.get('collection_status') as FormControl;
  }

  get collectionMethodControl() {
    return this.editCollectionForm?.get('collection_method') as FormControl;
  }

  get collectionDateControl() {
    return this.editCollectionForm?.get('collection_date') as FormControl;
  }


}
