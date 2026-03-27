import {Component, DestroyRef, OnInit, computed, effect, inject, signal} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {DecimalPipe, NgClass} from '@angular/common';
import Swal from 'sweetalert2';
import {DataFormatPipe} from '../../../../shared/pipe/data-format.pipe';
import {SearchService} from '../../../../core/services/shared-services/search.service';
import {PaginationService} from '../../../../core/services/shared-services/pagination.service';
import {PaginationConfig} from '../../../../interfaces/pagination-interface';
import {InvoicesReceivedService} from '../../../../core/services/entity-services/invoices-received.service';
import {InvoiceUtilsHelper} from '../../../../core/helpers/invoice-utils.helper';
import {InvoiceReceived} from '../../../../interfaces/invoices-received-interface';
import {
  PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS
} from '../../../../shared/Collection-Enum/collection-enum';
import {ExportService} from '../../../../core/services/shared-services/exportar.service';
import {ExportableListBase} from '../../../../shared/Base/exportable-list.base';

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
    NgClass, DecimalPipe
  ],
  templateUrl: './invoices-received-list.component.html',
  styleUrl: './invoices-received-list.component.css'
})
export class InvoicesReceivedListComponent extends ExportableListBase<InvoiceReceived> implements OnInit {

  private readonly invoicesReceivedService = inject(InvoicesReceivedService);
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);
  private readonly paginationService = inject(PaginationService);
  protected readonly invoicesUtilService = inject(InvoiceUtilsHelper);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly exportService = inject(ExportService);

  // ==========================================
  // FORMULARIOS
  // ==========================================

  readonly searchForm = this.fb.group({searchTerm: ['']});

  readonly filtersForm = this.fb.group({
    selectedPaymentStatus: [''],
    selectedRefundStatus: [''],
    selectedCategory: [''],
    selectedSupplier: ['']
  });

  readonly paginationForm = this.fb.group({itemsPerPage: [5]});

  readonly refundForm = this.fb.group({
    refundReason: ['', Validators.required]
  });

  // FormGroup nullable para edición inline de una factura a la vez (estado imperativo)
  editPaymentForm: FormGroup | null = null;

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

  private readonly allInvoices = signal<InvoiceReceived[]>([]);
  readonly currentPage = signal(1);
  readonly showRefundModal = signal(false);
  readonly selectedInvoice = signal<InvoiceReceived | null>(null);

  // Estado imperativo de edición de pago (una factura a la vez)
  editingPayment = new Set<number>();

  readonly categoryOptions = computed(() =>
    this.allInvoices()
      .map(inv => inv.category)
      .filter(Boolean)
      .filter((cat, i, arr) => arr.indexOf(cat) === i)
      .sort() as string[]
  );

  readonly suppliersOptions = computed(() =>
    this.allInvoices()
      .map(inv => inv.supplier_name)
      .filter((s): s is string => !!s)
      .filter((s, i, arr) => arr.indexOf(s) === i)
      .sort()
  );

  readonly refundStatusOptions = [
    {value: 'true', label: 'Abono'},
    {value: 'false', label: 'Factura Normal'}
  ];

  private readonly filteredInvoices = computed(() => {
    let filtered = [...this.allInvoices()];
    const fv = this._filtersValue();

    const search = this.searchTerm() ?? '';
    const paymentStatus = fv.selectedPaymentStatus ?? '';
    const refundStatus = fv.selectedRefundStatus ?? '';
    const category = fv.selectedCategory ?? '';
    const supplier = fv.selectedSupplier ?? '';

    if (search.trim()) {
      filtered = this.searchService.filterData(
        filtered, search,
        ['invoice_number', 'our_reference', 'supplier_name', 'category']
      );
    }
    if (paymentStatus) {
      filtered = filtered.filter(inv => inv.collection_status === paymentStatus);
    }
    if (category) {
      filtered = filtered.filter(inv => inv.category === category);
    }
    if (supplier) {
      filtered = filtered.filter(inv => inv.supplier_name === supplier);
    }
    if (refundStatus !== '') {
      const isRefund = refundStatus === 'true';
      filtered = filtered.filter(inv => Boolean(inv.is_refund) === isRefund);
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

  readonly entityName = 'facturas-recibidas';
  readonly selectedItems = new Set<number>();

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

  readonly paymentStatusLabels = PAYMENT_STATUS_LABELS;
  readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;

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

  getFilteredData(): InvoiceReceived[] {return this.filteredInvoices();}
  getCurrentPageData(): InvoiceReceived[] {return this.paginationInfo().items;}
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

  loadInvoices(): void {
    this.invoicesReceivedService.getAllInvoicesReceived().subscribe({
      next: (invoicesList) => {
        this.allInvoices.set(invoicesList);
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
      selectedPaymentStatus: '',
      selectedRefundStatus: '',
      selectedCategory: '',
      selectedSupplier: ''
    });
  }

  // ==========================================
  // PAGINACIÓN
  // ==========================================

  goToPage(page: number): void {
    if (this.paginationService.isValidPage(page, this.paginationInfo().totalPages)) {
      this.currentPage.set(page);
    }
  }

  previousPage(): void {
    if (this.paginationInfo().hasPrevious) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.paginationInfo().hasNext) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  // ==========================================
  // CRUD
  // ==========================================

  createNewInvoice(): void {
    this.router.navigate(['/dashboards/invoices-received/register']);
  }

  editInvoice(id: number) {
    this.router.navigate(['/dashboards/invoices-received/edit', id]);
  }

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
        this.invoicesReceivedService.deleteInvoiceReceived(id).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminada',
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
  // GESTIÓN DE PAGOS (FormGroup inline nullable)
  // ==========================================

  startEditingPayment(invoice: InvoiceReceived): void {
    this.editPaymentForm = this.fb.group({
      collection_status: [invoice.collection_status || 'pending'],
      collection_method: [invoice.collection_method || 'transfer'],
      collection_date: [invoice.collection_date || ''],
      collection_reference: [invoice.collection_reference || ''],
      collection_notes: [invoice.collection_notes || '']
    });
    this.editingPayment.add(invoice.id!);
  }

  cancelEditingPayment(invoiceId: number): void {
    this.editingPayment.delete(invoiceId);
    this.editPaymentForm = null;
  }

  isEditingPayment(invoiceId: number): boolean {
    return this.editingPayment.has(invoiceId);
  }

  savePaymentChanges(invoiceId: number): void {
    if (!this.editPaymentForm || this.editPaymentForm.invalid) {
      return;
    }

    const formValues = this.editPaymentForm.value;

    if (formValues.collection_status === 'paid' && !formValues.collection_date) {
      Swal.fire({
        title: 'Error',
        text: 'Las facturas marcadas como pagadas deben tener una fecha de pago',
        icon: 'error'
      });
      return;
    }

    this.invoicesReceivedService.updatePaymentStatus(invoiceId, formValues).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Estado de pago actualizado correctamente',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        this.editingPayment.delete(invoiceId);
        this.editPaymentForm = null;
        this.loadInvoices();
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

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
    this.invoicesReceivedService.updatePaymentStatus(invoice.id!, paymentData).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
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
  // MODAL DE ABONOS
  // ==========================================

  openRefundModal(invoice: InvoiceReceived): void {
    this.selectedInvoice.set(invoice);
    this.showRefundModal.set(true);
    this.refundForm.patchValue({refundReason: ''});
  }

  closeRefundModal(): void {
    this.showRefundModal.set(false);
    this.selectedInvoice.set(null);
    this.refundForm.reset();
  }

  saveRefund(): void {
    if (this.refundForm.invalid) {
      this.refundForm.markAllAsTouched();
      Swal.fire({
        title: 'Error',
        text: 'El motivo del abono es obligatorio',
        icon: 'error'
      });
      return;
    }

    const refundReason = this.refundForm.getRawValue().refundReason ?? '';

    this.invoicesReceivedService.createRefund(
      this.selectedInvoice()?.id!,
      refundReason
    ).pipe(
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
  // DESCARGA PDF Y ADJUNTOS
  // ==========================================

  downloadPdf(invoiceId: number): void {
    const invoice = this.paginationInfo().items.find(inv => inv.id === invoiceId);
    const isRefund = invoice?.is_refund;

    Swal.fire({
      title: 'Generando PDF...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const downloadMethod = isRefund
      ? this.invoicesReceivedService.downloadRefundInvoicePdf(invoiceId)
      : this.invoicesReceivedService.downloadInvoicePdf(invoiceId);

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
          ? `abono-recibido-${invoice?.invoice_number || invoiceId}.pdf`
          : `factura-recibida-${invoice?.invoice_number || invoiceId}.pdf`;
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

  viewAttachment(invoice: InvoiceReceived): void {
    if (!invoice.has_attachments || !invoice.pdf_path) {
      Swal.fire({title: 'Sin archivo', text: 'Esta factura no tiene archivo adjunto', icon: 'info'});
      return;
    }
    Swal.fire({
      title: 'Cargando archivo...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.invoicesReceivedService.downloadAttachment(invoice.pdf_path).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (blob) => {
        Swal.close();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      },
      error: () => {
        Swal.close();
        Swal.fire({title: 'Error', text: 'No se pudo cargar el archivo', icon: 'error'});
      }
    });
  }
}
