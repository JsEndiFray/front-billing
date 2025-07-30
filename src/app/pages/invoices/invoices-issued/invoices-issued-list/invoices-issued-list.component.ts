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
import {SearchService} from '../../../../core/services/search-services/search.service';
import Swal from 'sweetalert2';
import {CommonModule} from '@angular/common';

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
    private router: Router,
    private searchService: SearchService,
  ) {
  }

  /**
   * Se ejecuta al cargar el componente
   * Carga la lista de facturas automáticamente
   */
  ngOnInit(): void {
    this.getListInvoices();
  }


  /**
   * Determina si una factura es proporcional
   */
  isInvoiceProportional(invoice: Invoice): boolean {
    return invoice.is_proportional === 1;
  }


  /**
   * Genera la descripción del período para facturas proporcionales
   */
  getProportionalPeriod(invoice: Invoice): string {
    if (!this.isInvoiceProportional(invoice)) {
      return '-';
    }

    if (invoice.start_date && invoice.end_date) {
      const startDate = new Date(invoice.start_date);
      const endDate = new Date(invoice.end_date);

      const startFormatted = `${startDate.getDate().toString().padStart(2, '0')}/${(startDate.getMonth() + 1).toString().padStart(2, '0')}`;
      const endFormatted = `${endDate.getDate().toString().padStart(2, '0')}/${(endDate.getMonth() + 1).toString().padStart(2, '0')}`;

      return `${startFormatted} al ${endFormatted}`;
    }

    return 'Sin período';
  }

  /**
   * Formatea el mes de correspondencia para mostrar
   */
  getCorrespondingMonthDisplay(invoice: Invoice): string {
    if (!invoice.corresponding_month) {
      return '-';
    }

    const [year, month] = invoice.corresponding_month.split('-');
    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    const monthName = monthNames[parseInt(month, 10) - 1];
    return `${monthName} ${year}`;
  }


  /**
   * Calcula los días facturados para facturas proporcionales
   */
  getProportionalDays(invoice: Invoice): string {
    if (!this.isInvoiceProportional(invoice) || !invoice.start_date || !invoice.end_date) {
      return '-';
    }

    const startDate = new Date(invoice.start_date);
    const endDate = new Date(invoice.end_date);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return `${diffDays} días`;
  }

  /**
   * Obtiene todas las facturas del servidor
   * Guarda una copia original para los filtros de búsqueda
   */
  getListInvoices() {
    this.invoicesIssuedService.getAllInvoicesIssued().subscribe({
      next: (data) => {
        this.invoices = data;        // Lista que se muestra
        this.allInvoices = data;     // Copia original para filtros
        console.log(data)
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
        this.invoices = [];
        this.allInvoices = [];
      }
    })
  }

  /**
   * Filtra la lista de facturas según el texto de búsqueda
   * Busca en: número de factura, ID de propiedad, ID de cliente, ID de propietario, mes correspondencia
   */
  filterInvoices() {
    this.invoices = this.searchService.filterData(
      this.allInvoices,
      this.searchTerm,
      ['invoice_number', 'estates_id', 'clients_id', 'owners_id', 'corresponding_month', 'estate_name', 'client_name', 'owner_name']
    )
  }


  /**
   * Limpia el filtro de búsqueda y muestra todas las facturas
   */
  clearSearch() {
    this.searchTerm = '';
    this.filterInvoices();
  }

  /**
   * Se ejecuta cada vez que el usuario escribe en el buscador
   */
  onSearchChange() {
    this.filterInvoices();
  }

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
