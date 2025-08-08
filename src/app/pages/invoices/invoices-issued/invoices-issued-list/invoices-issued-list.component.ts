import {Component, OnInit} from '@angular/core';
import {
  BILLING_TYPE_LABELS,
  COLLECTION_METHOD_LABELS,
  COLLECTION_STATUS_LABELS,
  Invoice,
  RefundInvoice
} from '../../../../interface/invoices-issued-interface';
import {DataFormatPipe} from '../../../../shared/pipe/data-format.pipe';
import {InvoicesIssuedService} from '../../../../core/services/invoices-issued-service/invoices-issued.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {NgClass} from '@angular/common';
import {SearchService} from '../../../../core/services/shared-services/search.service';
import Swal from 'sweetalert2';
import {CommonModule} from '@angular/common';
import {PaginationConfig, PaginationResult} from '../../../../interface/pagination-interface';
import {PaginationService} from '../../../../core/services/shared-services/pagination.service';
import {
  InvoicesIssuedUtilService
} from '../../../../core/services/invoices-issued-util-services/invoices-issued-util.service';


/**
 * Componente para mostrar y gestionar la lista de facturas
 * Permite buscar, crear, editar, eliminar y descargar facturas en PDF
 */
@Component({
  selector: 'app-invoices-issued-list',
  imports: [
    DataFormatPipe,
    ReactiveFormsModule,
    FormsModule,
    NgClass,
    CommonModule,
  ],
  templateUrl: './invoices-issued-list.component.html',
  styleUrl: './invoices-issued-list.component.css'
})
export class InvoicesIssuedListComponent implements OnInit {

  // Lista de facturas que se muestra en la tabla
  invoices: Invoice[] = [];

  // Lista completa de facturas (datos originales sin filtrar)
  allInvoices: Invoice[] = [];

  // Texto que escribe el usuario para buscar
  searchTerm: string = '';

  // Lista de clientes filtrados (antes de paginar)
  filteredInvoices: Invoice[] = [];

  //pago pendientes filtros
  selectedCollectionStatus: string = '';
  selectedTypeBilling: string = '';
  selectedOwners: string = '';
  selectedClients: string = '';
  selectedRefundStatus: string = '';

  // Opciones para filtros
  collectionStatusOptions: Array<'pending' | 'collected' | 'overdue' | 'disputed'> = [];
  billingTypeOptions: Array<0 | 1> = [];
  ownersOptions: string[] = [];
  clientsOptions: string[] = [];
  refundStatusOptions: { value: string, label:string }[] = [];

  // Configuración de paginación
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

  // Variables para el modal de abonos
  showRefundModal: boolean = false;
  selectedInvoice: Invoice | null = null;

  // Datos del nuevo abono
  newRefund: RefundInvoice = {
    originalInvoiceId: 0,
    invoice_date: '',
    amount: 0,
    concept: '',
    collection_method: 'tranfer'
  };

  //NUEVAS VARIABLES PARA GESTIÓN DE PAGOS

  // Labels para mostrar en la UI
  collectionStatusLabels = COLLECTION_STATUS_LABELS;
  collectionMethodLabels = COLLECTION_METHOD_LABELS;
  billingTypeLabels = BILLING_TYPE_LABELS;

  //Datos temporales para edición rápida - AHORA USA INVOICE
  editingCollection: { [invoiceId: number]: Partial<Invoice> } = {};


  constructor(
    private invoicesIssuedService: InvoicesIssuedService,
    private invoicesIssuedUtilService: InvoicesIssuedUtilService,
    private router: Router,
    private searchService: SearchService,
    private paginationService: PaginationService,
  ) {
  }

  /**
   * Se ejecuta al cargar el componente
   * Carga la lista de facturas automáticamente
   */
  ngOnInit(): void {
    this.getListInvoices();
  }

  // GETTER; se pasa para los metodos en el html
  get invoiceUtilsService() {
    return this.invoicesIssuedUtilService;
  }

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
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  }

  //==========================
  // PROCESO DE LOS FILTROS
  //==========================

  /**
   * Limpia el filtro de búsqueda y muestra todas las facturas
   */
  clearFilters() {
    this.searchTerm = '';
    this.applyFilters();
  }

  /**
   * Se ejecuta cada vez que cambia algún filtro o el término de búsqueda.
   * Aplica todos los filtros disponibles para actualizar la lista de facturas.
   */
  onFilterCharger() {
    this.applyFilters();
  }

  /**
   * Extrae todos los filtos
   */
  extractFilterOptions() {
    //Extrae los estados de cobro únicos
    this.collectionStatusOptions = ['pending', 'collected', 'overdue', 'disputed'];

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
      { value: '1', label: 'Abono' },
      { value: '0', label: 'Factura' }
    ];
  }
  /**
   * Filtra la lista de facturas según el texto de búsqueda
   * Busca en: número de factura, ID de propiedad, ID de cliente, ID de propietario, mes correspondencia
   */
  applyFilters() {
    let filtered = [...this.allInvoices];
    // Filtro por búsqueda de texto
    if (this.searchTerm.trim()) {
      filtered = this.searchService.filterData(
        filtered,
        this.searchTerm,
        ['invoice_number', 'estates_id', 'clients_id', 'owners_id', 'corresponding_month', 'estate_name', 'client_name', 'owner_name']
      )
    }
    //filtro por estado de pagos
    if (this.selectedCollectionStatus) {
      filtered = filtered.filter(invoice => invoice.collection_status === this.selectedCollectionStatus);
    }
    //filtro por mes o porporcional
    if (this.selectedTypeBilling !== '') {
      filtered = filtered.filter(invoice => invoice.is_proportional === Number(this.selectedTypeBilling));
    }
    //filtro facturas por propietarios
    if (this.selectedOwners) {
      filtered = filtered.filter(invoice => invoice.owner_name === this.selectedOwners);
    }
    //filtro facturas por clientes
    if (this.selectedClients) {
      filtered = filtered.filter(invoice => invoice.client_name === this.selectedClients);
    }
    // Filtro solo facturas de abono
    if(this.selectedRefundStatus !== ''){
      filtered = filtered.filter(invoice => invoice.is_refund === Number(this.selectedRefundStatus));
    }


    this.filteredInvoices = filtered;
    this.paginationConfig.totalItems = filtered.length;
    this.paginationConfig.currentPage = 1;
    this.updatePagination();
  }


  //==============
  // PAGINACION
  //=============
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


  //===========
  // CRUD
  //===========

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
  // GESTIÓN DE COBROS (antes pagos)
  // ==========================================


  /**
   * Prepara los datos para editar el cobro de una factura
   */
  startEditingCollection(invoice: Invoice) {
    this.editingCollection[invoice.id!] = {
      collection_status: invoice.collection_status || 'pending',
      collection_method: invoice.collection_method || 'transfer',
      collection_date: invoice.collection_date || undefined,
      collection_notes: invoice.collection_notes || undefined,
      collection_reference: invoice.collection_reference || undefined
    };
  }

  /**
   * Cancela la edición del cobro
   */
  cancelEditingCollection(invoiceId: number) {
    delete this.editingCollection[invoiceId];
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
  saveCollectionChanges(invoiceId: number) {
    const collectionData = this.editingCollection[invoiceId];

    if (!collectionData) {
      return;
    }
    // Validación: Si se marca como cobrado, debe tener fecha
    if (collectionData.collection_status === 'collected' && !collectionData.collection_date) {
      Swal.fire({
        title: 'Error',
        text: 'Las facturas cobradas deben tener una fecha de cobro',
        icon: 'error'
      });
      return;
    }
    // Llamar al servicio para actualizar
    this.invoicesIssuedService.updateCollectionStatus(invoiceId, collectionData).subscribe({
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
        this.getListInvoices();
      }, error: (e: HttpErrorResponse) => {
      }
    });
  };

  /**
   * Cambio rápido de estado pendiente/cobrado
   */
  toggleCollectionStatus(invoice: Invoice) {
    const newStatus = invoice.collection_status === 'collected' ? 'pending' : 'collected';

    const collectionData: Partial<Invoice> = {
      collection_status: newStatus,
      collection_method: invoice.collection_method || 'transfer',
      collection_date: newStatus === 'collected' ? new Date().toISOString().split('T')[0] : null,
      collection_notes: invoice.collection_notes || undefined,
      collection_reference: invoice.collection_reference || undefined
    };
    this.invoicesIssuedService.updateCollectionStatus(invoice.id!, collectionData).subscribe({
      next: () => {
        // Actualizar localmente para respuesta inmediata
        invoice.collection_status = newStatus;
        invoice.collection_date = collectionData.collection_date;
        invoice.collection_reference = collectionData.collection_reference;
        invoice.collection_notes = collectionData.collection_notes;

        const statusText = newStatus === 'collected' ? 'cobrada' : 'pendiente';
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
  openRefundModal(invoice: Invoice) {
    this.selectedInvoice = invoice;
    this.showRefundModal = true;
    // Preparar datos del nuevo abono
    this.newRefund = {
      originalInvoiceId: invoice.id!,
      invoice_date: new Date().toISOString().split('T')[0],
      amount: 0,
      concept: '',
    };
  }

  /**
   * Cierra el modal de abonos
   */
  closeRefundModal() {
    this.showRefundModal = false;
    this.selectedInvoice = null;
  }

  /**
   * Guarda el nuevo abono
   */
  saveRefund() {
    // Validaciones básicas
    if (!this.newRefund.amount || this.newRefund.amount <= 0) {
      Swal.fire({
        title: 'Error',
        text: 'El monto del abono debe ser mayor a cero',
        icon: 'error'
      });
      return;
    }

    if (!this.newRefund.invoice_date) {
      Swal.fire({
        title: 'Error',
        text: 'La fecha del abono es obligatoria',
        icon: 'error'
      });
      return;
    }

    // Crear el abono con datos limpios
    this.invoicesIssuedService.createRefund(this.newRefund).subscribe({
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
}
