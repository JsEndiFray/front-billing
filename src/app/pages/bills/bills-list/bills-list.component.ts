import {Component, OnInit} from '@angular/core';
import {Bill, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, Refunds} from '../../../interface/bills-interface';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import {BillsService} from '../../../core/services/bills-services/bills.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {NgClass} from '@angular/common';
import {SearchService} from '../../../core/services/search-services/search.service';
import Swal from 'sweetalert2';
import {CommonModule} from '@angular/common';
import {RefundsService} from '../../../core/services/refunds-services/refunds.service';

/**
 * Componente para mostrar y gestionar la lista de facturas
 * Permite buscar, crear, editar, eliminar y descargar facturas en PDF
 */
@Component({
  selector: 'app-bills-list',
  imports: [
    DataFormatPipe,
    ReactiveFormsModule,
    FormsModule,
    NgClass,
    CommonModule,
  ],
  templateUrl: './bills-list.component.html',
  styleUrl: './bills-list.component.css'
})
export class BillsListComponent implements OnInit {

  // Lista de facturas que se muestra en la tabla
  bills: Bill[] = [];

  // Lista completa de facturas (datos originales sin filtrar)
  allBills: Bill[] = [];

  // Texto que escribe el usuario para buscar
  searchTerm: string = '';

  // Variables para el modal de abonos
  showPaymentModal: boolean = false;
  selectedBill: Bill | null = null;

  // Datos del nuevo abono
  newPayment: Refunds = {
    originalBillId: 0,
    amount: 0,
    bill_date: '',
    payment_method: 'transfer',
    notes: ''
  };

  //NUEVAS VARIABLES PARA GESTIÓN DE PAGOS

  // Labels para mostrar en la UI
  paymentStatusLabels = PAYMENT_STATUS_LABELS;
  paymentMethodLabels = PAYMENT_METHOD_LABELS;

  //Datos temporales para edición rápida - AHORA USA BILL
  editingPayment: { [billId: number]: Bill } = {};


  constructor(
    private billsServices: BillsService,
    private router: Router,
    private searchService: SearchService,
    private refundsService: RefundsService,
  ) {
  }

  /**
   * Se ejecuta al cargar el componente
   * Carga la lista de facturas automáticamente
   */
  ngOnInit(): void {
    this.getListBills();
  }

  /**
   * Obtiene todas las facturas del servidor
   * Guarda una copia original para los filtros de búsqueda
   */
  getListBills() {
    this.billsServices.getAllBills().subscribe({
      next: (data) => {
        this.bills = data;        // Lista que se muestra
        this.allBills = data;     // Copia original para filtros
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  }

  /**
   * Filtra la lista de facturas según el texto de búsqueda
   * Busca en: número de factura, ID de propiedad, ID de cliente, ID de propietario
   */
  filterBills() {
    this.bills = this.searchService.filterData(
      this.allBills,
      this.searchTerm,
      ['bill_number', 'estates_id', 'clients_id', 'owners_id']
    )
  }

  /**
   * Limpia el filtro de búsqueda y muestra todas las facturas
   */
  clearSearch() {
    this.searchTerm = '';
    this.filterBills();
  }

  /**
   * Se ejecuta cada vez que el usuario escribe en el buscador
   */
  onSearchChange() {
    this.filterBills();
  }

  /**
   * Navega a la página de registro de nueva factura
   */
  createNewBill() {
    this.router.navigate(['/dashboard/bills/register']);
  }

  /**
   * Navega a la página de edición de factura
   */
  editBill(id: number) {
    this.router.navigate(['/dashboard/bills/edit', id]);
  }

  //NUEVOS MÉTODOS PARA GESTIÓN DE PAGOS
  /**
   * Prepara los datos para editar el pago de una factura
   */
  startEditingPayment(bill: Bill) {
    this.editingPayment[bill.id!] = {
      payment_status: bill.payment_status || 'pending',
      payment_method: bill.payment_method || 'transfer',
      payment_date: bill.payment_date || '',
      payment_notes: bill.payment_notes || ''
    };
  }

  /**
   * Cancela la edición del pago
   */
  cancelEditingPayment(billID: number) {
    delete this.editingPayment[billID];
  }

  /**
   * Verifica si una factura está en modo edición
   */
  isEditingPayment(billId: number): boolean {
    return !!this.editingPayment[billId];
  }

  /**
   * Guarda los cambios del estado de pago
   */
  savePaymentChanges(billId: number) {
    const paymentData = this.editingPayment[billId];

    if (!paymentData) {
      return;
    }
    // Validación: Si se marca como pagado, debe tener fecha
    if (paymentData.payment_status === 'paid' && !paymentData.payment_date) {
      Swal.fire({
        title: 'Error',
        text: 'Las facturas pagadas deben tener una fecha de pago',
        icon: 'error'
      });
      return;
    }
    // Llamar al servicio para actualizar
    this.billsServices.updatePaymentStatus(billId, paymentData).subscribe({
      next: (updatedBill) => {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Estado de pago actualizado correctamente',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

        // Limpiar edición y recargar lista
        delete this.editingPayment[billId];
        this.getListBills();
      }, error: (e: HttpErrorResponse) => {
      }
    });
  };

  /**
   * Cambio rápido de estado pendiente/pagado
   */
  togglePaymentStatus(bill: Bill) {
    const newStatus = bill.payment_status === 'paid' ? 'pending' : 'paid';

    const paymentData: Partial<Bill> = {
      payment_status: newStatus,
      payment_method: bill.payment_method || 'transfer',
      payment_date: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : null,
      payment_notes: bill.payment_notes || ''
    };
    this.billsServices.updatePaymentStatus(bill.id!, paymentData).subscribe({
      next: (updatedBill) => {
        // Actualizar localmente para respuesta inmediata
        bill.payment_status = newStatus;
        bill.payment_date = paymentData.payment_date;

        const statusText = newStatus === 'paid' ? 'pagada' : 'pendiente';
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

  //NUEVOS MÉTODOS PARA ABONOS
  /**
   * Abre el modal para registrar un abono
   */
  openPaymentModal(bill: Bill) {
    this.selectedBill = bill;
    this.showPaymentModal = true;

    // Preparar datos del nuevo abono CON LOS CAMPOS CORRECTOS
    this.newPayment = {
      originalBillId: bill.id!,
      bill_date: new Date().toISOString().split('T')[0],
      amount: 0,
      concept: '',
      payment_method: 'transfer',     // Solo para frontend
      notes: ''                       // Solo para frontend
    };
  };

  /**
   * Cierra el modal de abonos
   */
  closePaymentModal() {
    this.showPaymentModal = false;
    this.selectedBill = null;
  }

  /**
   * Guarda el nuevo abono
   */
  savePayment() {
    // Validaciones básicas
    if (!this.newPayment.amount || this.newPayment.amount <= 0) {
      Swal.fire({
        title: 'Error',
        text: 'El monto debe ser mayor a cero',
        icon: 'error'
      });
      return;
    }

    if (!this.newPayment.bill_date) {
      Swal.fire({
        title: 'Error',
        text: 'La fecha es obligatoria',
        icon: 'error'
      });
      return;
    }

    // CREAR OBJETO LIMPIO CON SOLO LOS CAMPOS QUE NECESITA EL BACKEND
    const refundData = {
      originalBillId: this.newPayment.originalBillId,
      bill_date: this.newPayment.bill_date,
      amount: this.newPayment.amount,
      concept: this.newPayment.concept || `Abono para factura ${this.selectedBill!.bill_number}`
    };

    // Crear el abono con datos limpios
    this.refundsService.createPayment(refundData).subscribe({
      next: (data) => {
        Swal.fire({
          title: 'Éxito!',
          text: 'Abono registrado correctamente',
          icon: 'success'
        });
        this.closePaymentModal();
        this.getListBills();
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  /**
   * Elimina una factura después de confirmar la acción
   * Muestra mensaje de confirmación antes de eliminar
   */
  deleteBill(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Usuario confirmó, proceder a eliminar
        this.billsServices.deleteBills(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado.',
              text: 'La factura fue eliminado correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
            // Recargar la lista para mostrar cambios
            this.getListBills();
          }, error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        })
      }
    })
  }

  /**
   * Descarga una factura en formato PDF
   * Muestra indicador de carga y maneja la descarga automática del archivo
   */
  downloadPDF(billId: number) {
    // Mostrar indicador de carga mientras se genera el PDF
    Swal.fire({
      title: 'Generando PDF...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Solicitar el PDF al servidor
    this.billsServices.downloadPDF(billId).subscribe({
      next: (pdfBlob) => {
        Swal.close();

        // Verificar que el archivo PDF no esté vacío
        if (pdfBlob.size === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Archivo vacío',
            text: 'El PDF generado está vacío'
          });
          return;
        }

        // Crear URL temporal para el archivo PDF
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `factura-${billId}.pdf`;

        // Descargar el archivo de forma invisible (sin agregar al DOM)
        link.style.display = 'none';
        link.click();

        // Limpiar la URL temporal después de un momento
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 100);

        // Mostrar mensaje de éxito
        Swal.fire({
          icon: 'success',
          title: '¡Descarga exitosa!',
          text: `Factura ${billId} descargada`,
          timer: 2000,
          showConfirmButton: false
        });

      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  }
}
