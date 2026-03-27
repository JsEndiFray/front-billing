import {Component, DestroyRef, OnInit, computed, effect, inject, signal} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
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
import {PaginationConfig} from '../../../../interfaces/pagination-interface';
import {PaginationService} from '../../../../core/services/shared-services/pagination.service';
import {InvoiceUtilsHelper} from '../../../../core/helpers/invoice-utils.helper';
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

  private readonly invoicesIssuedService = inject(InvoicesIssuedService);
  protected readonly invoicesUtilService = inject(InvoiceUtilsHelper);
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);
  private readonly paginationService = inject(PaginationService);
  private readonly validatorService = inject(ValidatorService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly exportService = inject(ExportService);

  // ==========================================
  // FORMULARIOS
  // ==========================================

  readonly searchForm = this.fb.group({searchTerm: ['']});

  readonly filtersForm = this.fb.group({
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

  readonly paginationForm = this.fb.group({itemsPerPage: [5]});

  readonly refundForm = this.fb.group({
    amount: ['', [Validators.required, Validators.min(0.01)]],
    invoice_date: ['', [Validators.required]],
    collection_method: ['transfer'],
    concept: ['']
  });

  // FormArray para edición inline de múltiples facturas (estado imperativo, no reactivo)
  editCollectionFormsArray = this.fb.array<FormGroup>([]);
  editingCollectionMap = new Map<number, number>();

  // ==========================================
  // SIGNALS DE FORMULARIO
  // ==========================================

  readonly searchTerm = toSignal(
    this.searchForm.controls.searchTerm.valueChanges,
    {initialValue: ''}
  );

  private readonly _filtersValue = toSignal(
    this.filtersForm.valueChanges,
    {initialValue: this.filtersForm.value}
  );

  private readonly _itemsPerPage = toSignal(
    this.paginationForm.controls.itemsPerPage.valueChanges,
    {initialValue: 5}
  );

  // ==========================================
  // ESTADO REACTIVO
  // ==========================================

  private readonly allInvoices = signal<Invoice[]>([]);
  readonly currentPage = signal(1);
  readonly showRefundModal = signal(false);
  readonly selectedInvoice = signal<Invoice | null>(null);

  readonly ownersOptions = computed(() =>
    this.allInvoices()
      .map(inv => inv.owner_name)
      .filter((owner): owner is string => !!owner)
      .filter((owner, i, arr) => arr.indexOf(owner) === i)
      .sort()
  );

  readonly clientsOptions = computed(() =>
    this.allInvoices()
      .map(inv => inv.client_name)
      .filter((client): client is string => !!client)
      .filter((client, i, arr) => arr.indexOf(client) === i)
      .sort()
  );

  readonly refundStatusOptions = [
    {value: '1', label: 'Abono'},
    {value: '0', label: 'Factura'}
  ];

  private readonly filteredInvoices = computed(() => {
    let filtered = [...this.allInvoices()];
    const fv = this._filtersValue();

    const search = this.searchTerm() ?? '';
    const collectionStatus = fv.selectedCollectionStatus ?? '';
    const refundStatus = fv.selectedRefundStatus ?? '';
    const owners = fv.selectedOwners ?? '';
    const clients = fv.selectedClients ?? '';
    const typeBilling = fv.selectedTypeBilling ?? '';
    const startDate = fv.startDate ?? '';
    const endDate = fv.endDate ?? '';
    const minAmount = fv.minAmount ?? null;
    const maxAmount = fv.maxAmount ?? null;

    if (search.trim()) {
      filtered = this.searchService.filterData(
        filtered, search,
        ['invoice_number', 'estates_id', 'clients_id', 'owners_id', 'corresponding_month', 'estate_name', 'client_name', 'owner_name']
      );
    }
    if (collectionStatus) {
      filtered = filtered.filter(inv => inv.collection_status === collectionStatus);
    }
    if (refundStatus) {
      filtered = filtered.filter(inv => inv.is_refund === Number(refundStatus));
    }
    if (owners) {
      filtered = filtered.filter(inv => inv.owner_name === owners);
    }
    if (clients) {
      filtered = filtered.filter(inv => inv.client_name === clients);
    }
    if (typeBilling) {
      filtered = filtered.filter(inv => inv.is_proportional === Number(typeBilling));
    }
    if (startDate) {
      filtered = filtered.filter(inv => {
        if (!inv.invoice_date) return false;
        const d = new Date(inv.invoice_date);
        return !isNaN(d.getTime()) && d >= new Date(startDate);
      });
    }
    if (endDate) {
      filtered = filtered.filter(inv => {
        if (!inv.invoice_date) return false;
        const d = new Date(inv.invoice_date);
        return !isNaN(d.getTime()) && d <= new Date(endDate);
      });
    }
    if (minAmount !== null) {
      filtered = filtered.filter(inv => (inv.total || 0) >= minAmount);
    }
    if (maxAmount !== null) {
      filtered = filtered.filter(inv => (inv.total || 0) <= maxAmount);
    }
    return filtered;
  });

  readonly paginationInfo = computed(() => {
    const filtered = this.filteredInvoices();
    return this.paginationService.paginate(filtered, {
      currentPage: this.currentPage(),
      itemsPerPage: this._itemsPerPage() ?? 5,
      totalItems: filtered.length
    });
  });

  readonly visiblePages = computed(() =>
    this.paginationService.getVisiblePages(
      this.currentPage(),
      this.paginationInfo().totalPages,
      5
    )
  );

  readonly paginationText = computed(() =>
    this.paginationService.getPaginationText(
      {
        currentPage: this.currentPage(),
        itemsPerPage: this._itemsPerPage() ?? 5,
        totalItems: this.filteredInvoices().length
      },
      this.paginationInfo().items.length
    )
  );

  // ==========================================
  // EXPORTACIÓN (ExportableListBase)
  // ==========================================

  readonly entityName = 'facturas-emitidas';
  readonly selectedItems = new Set<number>();

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

  readonly collectionStatusLabels = COLLECTION_STATUS_LABELS;
  readonly collectionMethodLabels = COLLECTION_METHOD_LABELS;
  readonly billingTypeLabels = BILLING_TYPE_LABELS;

  constructor() {
    super();
    effect(() => {
      this.searchTerm();
      this._filtersValue();
      this.currentPage.set(1);
    }, {allowSignalWrites: true});
  }

  // ==========================================
  // MÉTODOS ABSTRACTOS (ExportableListBase)
  // ==========================================

  getFilteredData(): Invoice[] {return this.filteredInvoices();}
  getCurrentPageData(): Invoice[] {return this.paginationInfo().items;}
  getPaginationConfig(): PaginationConfig {
    return {
      currentPage: this.currentPage(),
      itemsPerPage: this._itemsPerPage() ?? 5,
      totalItems: this.filteredInvoices().length
    };
  }

  ngOnInit(): void {
    this.loadInvoices();
  }

  // ==========================================
  // CARGA DE DATOS
  // ==========================================

  loadInvoices() {
    this.invoicesIssuedService.getAllInvoicesIssued().subscribe({
      next: (invoicesList) => {
        this.allInvoices.set(invoicesList);
        this.clearAllEditingForms();
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  // ==========================================
  // FILTROS
  // ==========================================

  clearFilters(): void {
    this.searchForm.patchValue({searchTerm: ''});
    this.filtersForm.patchValue({
      selectedCollectionStatus: '',
      selectedRefundStatus: '',
      selectedOwners: '',
      selectedClients: '',
      selectedTypeBilling: '',
      startDate: '',
      endDate: '',
      minAmount: null,
      maxAmount: null
    });
  }

  // ==========================================
  // PAGINACIÓN
  // ==========================================

  goToPage(page: number) {
    if (this.paginationService.isValidPage(page, this.paginationInfo().totalPages)) {
      this.currentPage.set(page);
    }
  }

  previousPage() {
    if (this.paginationInfo().hasPrevious) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage() {
    if (this.paginationInfo().hasNext) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  // ==========================================
  // CRUD
  // ==========================================

  createNewInvoice() {
    this.router.navigate(['/dashboards/invoices-issued/register']);
  }

  editInvoice(id: number) {
    this.router.navigate(['/dashboards/invoices-issued/edit', id]);
  }

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
        this.invoicesIssuedService.deleteInvoice(id).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado.',
              text: 'La factura fue eliminada correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
            this.loadInvoices();
          },
          error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        });
      }
    });
  }

  // ==========================================
  // GESTIÓN DE COBROS (FormArray inline)
  // ==========================================

  startEditingCollection(invoice: Invoice): void {
    if (this.editingCollectionMap.has(invoice.id!)) {
      return;
    }
    const formGroup = this.validatorService.createCollectionFormGroup(invoice);
    this.editCollectionFormsArray.push(formGroup);
    const newIndex = this.editCollectionFormsArray.length - 1;
    this.editingCollectionMap.set(invoice.id!, newIndex);
  }

  getCollectionFormGroup(invoiceId: number): FormGroup | null {
    const index = this.editingCollectionMap.get(invoiceId);
    if (index === undefined) return null;
    return this.editCollectionFormsArray.at(index) as FormGroup;
  }

  cancelEditingCollection(invoiceId: number): void {
    const index = this.editingCollectionMap.get(invoiceId);
    if (index === undefined) return;
    this.editCollectionFormsArray.removeAt(index);
    this.editingCollectionMap.delete(invoiceId);
    this.updateCollectionMapIndices(index);
  }

  isEditingCollection(invoiceId: number): boolean {
    return this.editingCollectionMap.has(invoiceId);
  }

  saveCollectionChanges(invoiceId: number): void {
    const formGroup = this.getCollectionFormGroup(invoiceId);
    if (!formGroup || formGroup.invalid) {
      if (formGroup) {
        formGroup.markAllAsTouched();
      }
      return;
    }

    const formValues = formGroup.value;

    if (formValues.collection_status === 'collected' && !formValues.collection_date) {
      Swal.fire({
        title: 'Error',
        text: 'Las facturas cobradas deben tener una fecha de cobro',
        icon: 'error'
      });
      return;
    }

    const {invoiceId: _, ...collectionData} = formValues;

    this.invoicesIssuedService.updateCollectionStatus(invoiceId, collectionData).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Estado de cobro actualizado correctamente',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        this.cancelEditingCollection(invoiceId);
        this.loadInvoices();
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

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
    this.invoicesIssuedService.updateCollectionStatus(invoice.id!, collectionData).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
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
  }

  // ==========================================
  // MODAL DE ABONOS
  // ==========================================

  openRefundModal(invoice: Invoice): void {
    this.selectedInvoice.set(invoice);
    this.showRefundModal.set(true);
    this.refundForm.patchValue({
      amount: '0',
      invoice_date: new Date().toISOString().split('T')[0],
      collection_method: 'transfer',
      concept: ''
    });
  }

  closeRefundModal() {
    this.showRefundModal.set(false);
    this.selectedInvoice.set(null);
    this.refundForm.reset();
  }

  saveRefund(): void {
    if (this.refundForm.invalid) {
      this.refundForm.markAllAsTouched();
      Swal.fire({
        title: 'Error',
        text: 'Por favor, complete todos los campos requeridos',
        icon: 'error'
      });
      return;
    }

    const formValues = this.refundForm.getRawValue();
    const refundData: RefundInvoice = {
      originalInvoiceId: this.selectedInvoice()?.id!,
      invoice_date: formValues.invoice_date ?? '',
      amount: parseFloat(formValues.amount ?? '0'),
      concept: formValues.concept?.trim() || '',
      collection_method: formValues.collection_method ?? undefined
    };

    this.invoicesIssuedService.createRefund(refundData).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        Swal.fire({
          title: 'Éxito!',
          text: 'Abono registrado correctamente',
          icon: 'success'
        });
        this.closeRefundModal();
        this.loadInvoices();
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  // ==========================================
  // DESCARGA PDF
  // ==========================================

  downloadPdf(invoiceId: number) {
    const invoice = this.paginationInfo().items.find(inv => inv.id === invoiceId);
    const isRefund = invoice?.is_refund === 1;

    Swal.fire({
      title: 'Generando PDF...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const downloadMethod = isRefund
      ? this.invoicesIssuedService.downloadRefundInvoicePdf(invoiceId)
      : this.invoicesIssuedService.downloadInvoicePdf(invoiceId);

    downloadMethod.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (pdfBlob) => {
        Swal.close();
        if (pdfBlob.size === 0) {
          Swal.fire({icon: 'warning', title: 'Archivo vacío', text: 'El PDF generado está vacío'});
          return;
        }
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = isRefund
          ? `abono-${invoice?.invoice_number || invoiceId}.pdf`
          : `factura-${invoice?.invoice_number || invoiceId}.pdf`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
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

  // ==========================================
  // GESTIÓN DEL FORMARRAY
  // ==========================================

  private updateCollectionMapIndices(removedIndex: number): void {
    const updatedMap = new Map<number, number>();
    this.editingCollectionMap.forEach((currentIndex, invoiceId) => {
      updatedMap.set(invoiceId, currentIndex > removedIndex ? currentIndex - 1 : currentIndex);
    });
    this.editingCollectionMap = updatedMap;
  }

  private clearAllEditingForms(): void {
    this.editCollectionFormsArray.clear();
    this.editingCollectionMap.clear();
  }
}
