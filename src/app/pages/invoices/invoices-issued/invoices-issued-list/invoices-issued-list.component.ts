import {Component, OnInit} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {Invoice, RefundInvoice} from '../../../../interfaces/invoices-issued-interface';
import {InvoicesIssuedService} from '../../../../core/services/entity-services/invoices-issued.service';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {NgClass} from '@angular/common';
import {SearchService} from '../../../../core/services/shared-services/search.service';
import Swal from 'sweetalert2';
import {CommonModule} from '@angular/common';
import {PaginationConfig, PaginationResult} from '../../../../interfaces/pagination-interface';
import {PaginationService} from '../../../../core/services/shared-services/pagination.service';
import {
  InvoiceUtilsHelper
} from '../../../../core/helpers/invoice-utils.helper';
import {
  BILLING_TYPE_LABELS,
  COLLECTION_METHOD_LABELS, COLLECTION_STATUS_LABELS,
} from '../../../../shared/Collection-Enum/collection-enum';
import {ValidatorService} from '../../../../core/services/validator-services/validator.service';
import {ExportService} from '../../../../core/services/shared-services/exportar.service';
import {ExportableListBase} from '../../../../shared/Base/exportable-list.base';
import {DataFormatPipe} from '../../../../shared/pipe/data-format.pipe';


/**
 * Componente para mostrar y gestionar la lista de facturas
 * Permite buscar, crear, editar, eliminar y descargar facturas en PDF
 */
@Component({
  selector: 'app-invoices-issued-list',
  imports: [
    ReactiveFormsModule,
    NgClass,
    CommonModule,
    DataFormatPipe,
  ],
  templateUrl: './invoices-issued-list.component.html',
  styleUrl: './invoices-issued-list.component.css'
})
export class InvoicesIssuedListComponent extends ExportableListBase<Invoice> implements OnInit {

  // ==========================================
  // PROPIEDADES DE FORMULARIOS MÚLTIPLES
  // ==========================================

  // FormGroup para búsqueda de texto
  searchForm: FormGroup;

  //Formulario para filtros de búsqueda
  filtersForm: FormGroup;

  // FormGroup para configuración de paginación
  paginationForm: FormGroup;

  // FormArray para editar cobros de múltiples facturas
  editCollectionFormsArray: FormArray;

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

  // Mapa para rastrear qué facturas están en edición
  editingCollectionMap: Map<number, number> = new Map(); // invoiceId -> formArrayIndex

  // Variables para el modal de abonos
  showRefundModal: boolean = false;

  // Factura seleccionada para crear abono
  selectedInvoice: Invoice | null = null;

  //===============================
  // FUNCIONES PARA LA EXPORTACION
  //===============================
  // Implementar propiedades abstractas
  entityName = 'facturas-emitidas'; //para nombrar los documentos descargados
  selectedItems: Set<number> = new Set();

  readonly exportColumns = [
    {key: 'id', title: 'ID', width: 10},
    {key: 'invoice_number', title: 'Nº Factura', width: 15},
    {key: 'estate_name', title: 'Propiedad', width: 25},
    {key: 'client_name', title: 'Cliente', width: 25},
    {key: 'owner_name', title: 'Propietario', width: 25},
    {key: 'invoice_date', title: 'Fecha', width: 12},
    {key: 'tax_base', title: 'Base', width: 12, formatter: (value: unknown) => value ? `${value} €` : '-'},
    {key: 'iva', title: 'IVA (%)', width: 10},
    {key: 'irpf', title: 'IRPF (%)', width: 10},
    {key: 'total', title: 'Total', width: 12, formatter: (value: unknown) => value ? `${value} €` : '-'},
    {key: 'collection_status', title: 'Estado Cobro', width: 15},
    {key: 'is_refund', title: 'Tipo', width: 12, formatter: (value: unknown) => value === 1 ? 'Abono' : 'Factura'}
  ];


  constructor(
    private invoicesIssuedService: InvoicesIssuedService,
    protected invoicesUtilService: InvoiceUtilsHelper,
    private router: Router,
    private searchService: SearchService,
    private paginationService: PaginationService,
    private fb: FormBuilder,
    private validatorService: ValidatorService,
    public exportService: ExportService,
  ) {
    super();

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
      startDate: [''],
      endDate: [''],
      minAmount: [null, [Validators.min(0)]],
      maxAmount: [null, [Validators.min(0)]]
    }, {
      validators: [this.validatorService.dateRangeValidator, this.validatorService.amountRangeValidator]
    });

    // FormGroup para paginación
    this.paginationForm = this.fb.group({
      itemsPerPage: [5]
    });

    // FormArray para múltiples ediciones
    this.editCollectionFormsArray = this.fb.array([]);

    //FormGroup para modal de abonos
    this.refundForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      invoice_date: ['', [Validators.required]],
      collection_method: ['transfer'],
      concept: ['']
    });
  }

  // Implementar métodos abstractos
  getFilteredData(): Invoice[] {
    return this.filteredInvoices;
  }

  getCurrentPageData(): Invoice[] {
    return this.invoices;
  }

  getPaginationConfig(): PaginationConfig {
    return this.paginationConfig;
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

    // Suscripción para cambios en paginación
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
   * Obtiene todas las facturas del servidor
   * Guarda una copia original para los filtros de búsqueda
   */
  getListInvoices() {
    this.invoicesIssuedService.getAllInvoicesIssued().subscribe({
      next: (invoicesList) => {
        this.allInvoices = invoicesList;
        this.extractFilterOptions();
        this.clearAllEditingForms();
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
   * Aplica todos los filtros a la lista de facturas
   */
  applyFilters(): void {
    let filtered = [...this.allInvoices];

    const search = this.searchForm.get('searchTerm')?.value;
    const collectionStatus = this.filtersForm.get('selectedCollectionStatus')?.value;
    const refundStatus = this.filtersForm.get('selectedRefundStatus')?.value;
    const owners = this.filtersForm.get('selectedOwners')?.value;
    const clients = this.filtersForm.get('selectedClients')?.value;
    const typeBilling = this.filtersForm.get('selectedTypeBilling')?.value;
    const startDate = this.filtersForm.get('startDate')?.value;
    const endDate = this.filtersForm.get('endDate')?.value;
    const minAmount = this.filtersForm.get('minAmount')?.value;
    const maxAmount = this.filtersForm.get('maxAmount')?.value;

    // Filtro por búsqueda de texto
    if (search?.trim()) {
      filtered = this.searchService.filterData(
        filtered, search,
        ['invoice_number', 'estates_id', 'clients_id', 'owners_id', 'corresponding_month', 'estate_name', 'client_name', 'owner_name']
      );
    }

    // Filtros existentes
    if (collectionStatus) {
      filtered = filtered.filter(invoice => invoice.collection_status === collectionStatus);
    }

    if (refundStatus) {
      filtered = filtered.filter(invoice => invoice.is_refund === Number(refundStatus));
    }

    if (owners) {
      filtered = filtered.filter(invoice => invoice.owner_name === owners);
    }

    if (clients) {
      filtered = filtered.filter(invoice => invoice.client_name === clients);
    }

    if (typeBilling) {
      filtered = filtered.filter(invoice => invoice.is_proportional === Number(typeBilling));
    }

    // Nuevos filtros de fecha
    if (startDate) {
      filtered = filtered.filter(invoice => {
        if (!invoice.invoice_date) return false;
        const invoiceDate = new Date(invoice.invoice_date);
        return !isNaN(invoiceDate.getTime()) && invoiceDate >= new Date(startDate);
      });
    }

    if (endDate) {
      filtered = filtered.filter(invoice => {
        if (!invoice.invoice_date) return false;
        const invoiceDate = new Date(invoice.invoice_date);
        return !isNaN(invoiceDate.getTime()) && invoiceDate <= new Date(endDate);
      });
    }

    // Nuevos filtros de monto
    if (minAmount !== null) {
      filtered = filtered.filter(invoice => (invoice.total || 0) >= minAmount);
    }

    if (maxAmount !== null) {
      filtered = filtered.filter(invoice => (invoice.total || 0) <= maxAmount);
    }

    this.filteredInvoices = filtered;
    this.paginationConfig.totalItems = filtered.length;
    this.paginationConfig.currentPage = 1;
    this.updatePagination();
  }

  /**
   * Limpia el filtro de búsqueda y muestra todas las facturas
   */
  clearFilters(): void {
    // Resetear cada FormGroup por separado con valores explícitos
    this.searchForm.patchValue({
      searchTerm: ''
    });

    // Resetear filtros incluyendo los nuevos campos
    this.filtersForm.patchValue({
      selectedCollectionStatus: '',
      selectedRefundStatus: '',
      selectedOwners: '',
      selectedClients: '',
      selectedTypeBilling: '', // Asegurarse que sea string vacío, no null
      startDate: '',
      endDate: '',
      minAmount: null,
      maxAmount: null
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
   * Agrega una factura al FormArray para edición
   */
  startEditingCollection(invoice: Invoice): void {
    // Verificar si ya está en edición
    if (this.editingCollectionMap.has(invoice.id!)) {
      return;
    }

    // Crear FormGroup y agregarlo al FormArray
    const formGroup = this.validatorService.createCollectionFormGroup(invoice);
    this.editCollectionFormsArray.push(formGroup);

    // Mapear ID de factura con índice del FormArray
    const newIndex = this.editCollectionFormsArray.length - 1;
    this.editingCollectionMap.set(invoice.id!, newIndex);
  }

  /**
   * Obtiene el FormGroup de una factura específica
   */
  getCollectionFormGroup(invoiceId: number): FormGroup | null {
    const index = this.editingCollectionMap.get(invoiceId);
    if (index === undefined) return null;

    return this.editCollectionFormsArray.at(index) as FormGroup;
  }

  /**
   * Cancela la edición de una factura específica
   */
  cancelEditingCollection(invoiceId: number): void {
    const index = this.editingCollectionMap.get(invoiceId);
    if (index === undefined) return;

    // Remover del FormArray
    this.editCollectionFormsArray.removeAt(index);

    // Actualizar el mapa (reindexar elementos posteriores)
    this.editingCollectionMap.delete(invoiceId);
    this.updateCollectionMapIndices(index);
  }

  /**
   * Verifica si una factura está en modo edición de cobro
   */
  isEditingCollection(invoiceId: number): boolean {
    return this.editingCollectionMap.has(invoiceId);
  }

  /**
   * Guarda los cambios del estado de cobro
   */
  saveCollectionChanges(invoiceId: number): void {
    const formGroup = this.getCollectionFormGroup(invoiceId)
    if (!formGroup || formGroup.invalid) {
      if (formGroup) {
        formGroup.markAllAsTouched();
      }
      return;
    }

    const formValues = formGroup.value;

    // DEBUG: Ver qué datos se están enviando
    console.log('Datos que se envían:', formValues);

    // Validación: Si se marca como cobrado, debe tener fecha
    if (formValues.collection_status === 'collected' && !formValues.collection_date) {
      Swal.fire({
        title: 'Error',
        text: 'Las facturas cobradas deben tener una fecha de cobro',
        icon: 'error'
      });
      return;
    }

    // Extraer datos sin el invoiceId interno
    const {invoiceId: _, ...collectionData} = formValues;

    // DEBUG: Ver datos finales
    console.log('Datos finales enviados al backend:', collectionData);

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
        this.cancelEditingCollection(invoiceId);
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
  toggleCollectionStatus(invoice: Invoice): void {
    const newStatus = invoice.collection_status === 'collected' ? 'pending' : 'collected';

    const collectionData: {
      collection_status: 'pending' | 'collected' | 'overdue' | 'disputed';
      collection_method: 'transfer' | 'direct_debit' | 'cash' | 'card' | 'check';
      collection_date?: string;
      collection_reference?: string;
      collection_notes?: string;
    } = {
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
      this.refundForm.markAllAsTouched(); // Mostrar errores
      Swal.fire({
        title: 'Error',
        text: 'Por favor, complete todos los campos requeridos',
        icon: 'error'
      });
      return;
    }

    const formValues = this.refundForm.value;

    // Crear objeto RefundInvoice con datos del FormGroup
    const refundData: RefundInvoice = {
      originalInvoiceId: this.selectedInvoice?.id!,
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
  // MÉTODOS DE GESTIÓN DEL FORMARRAY
  // ==========================================
  /**
   * Actualiza los índices del mapa después de una eliminación
   */
  private updateCollectionMapIndices(removedIndex: number): void {
    const updatedMap = new Map<number, number>();

    this.editingCollectionMap.forEach((currentIndex, invoiceId) => {
      if (currentIndex > removedIndex) {
        updatedMap.set(invoiceId, currentIndex - 1);
      } else {
        updatedMap.set(invoiceId, currentIndex);
      }
    });

    this.editingCollectionMap = updatedMap;
  }

  /**
   * Limpia todas las ediciones activas del FormArray
   */
  private clearAllEditingForms(): void {
    this.editCollectionFormsArray.clear();
    this.editingCollectionMap.clear();
  }

}
