import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Bill, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS} from '../../../interface/bills-interface';
import {BillsValidatorService} from '../../../core/services/validator-services/bills-validator.service';
import {Estates} from '../../../interface/estates.interface';
import {Clients} from '../../../interface/clientes-interface';
import {Owners} from '../../../interface/owners-interface';
import {EstatesService} from '../../../core/services/estates-services/estates.service';
import {HttpErrorResponse} from '@angular/common/http';
import {ClientsService} from '../../../core/services/clients-services/clients.service';
import {BillsService} from '../../../core/services/bills-services/bills.service';
import Swal from 'sweetalert2';
import {OwnersService} from '../../../core/services/owners-services/owners.service';
import {Router} from '@angular/router';
import {PaymentUtilService} from '../../../core/services/payment-util-services/payment-util.service';

/**
 * Componente para registrar nuevas facturas
 * Permite crear facturas con cálculo automático de totales y validaciones fiscales
 */
@Component({
  selector: 'app-bills',
  imports: [
    FormsModule
  ],
  templateUrl: './bills-register.component.html',
  styleUrl: './bills-register.component.css'
})
export class BillsRegisterComponent implements OnInit {

  // Listas para los selectores del formulario
  estates: Estates[] = [];     // Lista de propiedades disponibles
  clients: Clients[] = [];     // Lista de clientes disponibles
  owners: Owners[] = [];       // Lista de propietarios disponibles

  //LABELS PARA LOS NUEVOS CAMPOS DE PAGO
  paymentStatusLabels = PAYMENT_STATUS_LABELS;
  paymentMethodLabels = PAYMENT_METHOD_LABELS;

  // Objeto que guarda los datos de la nueva factura
  bill: Bill = {
    id: null,
    bill_number: '',
    estates_id: null,
    clients_id: null,
    owners_id: null,
    ownership_percent: null,
    date: '',
    tax_base: null,           // Base imponible
    iva: null,                // Porcentaje de IVA
    irpf: null,               // Porcentaje de IRPF
    total: null,              // Total calculado automáticamente
    is_refund: null,          // Si es una devolución
    original_bill_id: null,   // ID de factura original (para devoluciones)
    //NUEVOS CAMPOS DE PAGO CON VALORES POR DEFECTO
    payment_status: 'pending',        // Por defecto: Pendiente
    payment_method: 'transfer',       // Por defecto: Transferencia
    payment_date: null,               // Opcional: Se puede dejar vacío
    payment_notes: '',                // Opcional: Notas sobre el pago

    date_create: '',
    date_update: '',
  }

  constructor(
    private billsValidatorServices: BillsValidatorService,
    private estateServices: EstatesService,
    private clientsServices: ClientsService,
    private ownerServices: OwnersService,
    private billsServices: BillsService,
    private router: Router,
    private paymentUtilServices: PaymentUtilService,
  ) {
  }

  /**
   * Se ejecuta al cargar el componente
   * Carga todas las listas necesarias para los selectores
   */
  ngOnInit(): void {
    this.getListEstate();
    this.getListClients();
    this.getListOwners();
  }

  /**
   *NUEVO: Inicializa valores por defecto para los campos de pago
   */
  initializePaymentDefaults() {
    // Si el usuario marca como "pagado", establecer fecha de hoy
    this.paymentUtilServices.initializePaymentDefaults(this.bill);
  }

  /**
   *NUEVO: Se ejecuta cuando cambia el estado de pago
   * Si marca como "pagado", pone la fecha de hoy automáticamente
   */
  onPaymentStatusChange() {
    this.paymentUtilServices.handlePaymentStatusChange(this.bill);
  }

  /**
   * Calcula automáticamente el total basado en base imponible, IVA e IRPF
   * Fórmula fiscal: Total = Base + (Base × IVA%) - (Base × IRPF%)
   *
   * @example
   * Base: 1000€, IVA: 21%, IRPF: 15%
   * Total = 1000 + (1000 × 0.21) - (1000 × 0.15) = 1000 + 210 - 150 = 1060€
   */
  calculateTotal(): void {
    // Convertir valores a números, usar 0 si están vacíos
    const base = parseFloat(this.bill.tax_base?.toString() || '0') || 0;
    const ivaPercent = parseFloat(this.bill.iva?.toString() || '0') || 0;
    const irpfPercent = parseFloat(this.bill.irpf?.toString() || '0') || 0;

    // Aplicar la fórmula fiscal española
    const total = base + (base * ivaPercent / 100) - (base * irpfPercent / 100);

    // Redondear a 2 decimales para evitar problemas de precisión
    this.bill.total = parseFloat(total.toFixed(2));
  }

  /**
   * Se ejecuta cuando cambia la base imponible
   * Recalcula el total automáticamente
   */
  onTaxBaseChange(): void {
    this.calculateTotal();
  }

  /**
   * Se ejecuta cuando cambia el porcentaje de IVA
   * Recalcula el total automáticamente
   */
  onIvaChange(): void {
    this.calculateTotal();
  }

  /**
   * Se ejecuta cuando cambia el porcentaje de IRPF
   * Recalcula el total automáticamente
   */
  onIrpfChange(): void {
    this.calculateTotal();
  }

  /**
   * Obtiene la lista de propiedades para el selector
   */
  getListEstate() {
    this.estateServices.getAllEstate().subscribe({
      next: (data) => {
        this.estates = data;
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  };

  /**
   * Obtiene la lista de clientes para el selector
   */
  getListClients() {
    this.clientsServices.getClients().subscribe({
      next: (data) => {
        this.clients = data;
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  };

  /**
   * Obtiene la lista de propietarios para el selector
   */
  getListOwners() {
    this.ownerServices.getOwners().subscribe({
      next: (data) => {
        this.owners = data;
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  };

  /**
   * Registra una nueva factura en el sistema
   * Valida los datos antes de enviar al servidor
   */
  registerBills() {
    // Limpiar espacios y preparar datos
    const cleanData = this.billsValidatorServices.cleanBillsData(this.bill);
    // Validar que todos los campos requeridos estén completos
    const validation = this.billsValidatorServices.validateRequiredFields(cleanData);
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error!',
        text: validation.message,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    // Enviar datos al servidor para crear la factura
    this.billsServices.createBills(cleanData).subscribe({
      next: () => {
        Swal.fire({
          title: "Se ha registrado correctamente.",
          text: `Factura creada con estado: ${this.paymentStatusLabels[this.bill.payment_status || 'pending']}`,
          icon: "success",
          draggable: true
        });
        // Redirigir a la lista después del registro exitoso
        this.router.navigate(['/dashboard/bills/list'])
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  };

  goBack() {
    this.router.navigate(['/dashboard/bills/list'])
  }
}
