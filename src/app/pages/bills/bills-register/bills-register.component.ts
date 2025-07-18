import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {
  Bill,
  BILLING_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS, ProportionalSimulation, ProportionalSimulationResponse
} from '../../../interface/bills-interface';
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
import {BillsUtilService} from '../../../core/services/bills-util-services/Bills-Util-Service';
import {CurrencyPipe} from '@angular/common';

/**
 * Componente para registrar nuevas facturas
 * Permite crear facturas con cálculo automático de totales y validaciones fiscales
 */
@Component({
  selector: 'app-bills',
  imports: [
    FormsModule,
    CurrencyPipe
  ],
  templateUrl: './bills-register.component.html',
  styleUrl: './bills-register.component.css'
})
export class BillsRegisterComponent implements OnInit {

  // Listas para los selectores del formulario
  estates: Estates[] = [];     // Lista de propiedades disponibles
  clients: Clients[] = [];     // Lista de clientes disponibles
  owners: Owners[] = [];       // Lista de propietarios disponibles

  //LABELS PARA LOS NUEVOS CAMPOS DE PAGO Y PARA FACTURACIÓN PROPORCIONAL
  paymentStatusLabels = PAYMENT_STATUS_LABELS;
  paymentMethodLabels = PAYMENT_METHOD_LABELS;
  billingTypeLabels = BILLING_TYPE_LABELS;

  //VARIABLES PARA FACTURACIÓN PROPORCIONAL
  isSimulating: boolean = false;
  simulationResult: ProportionalSimulationResponse | null = null;

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
    //🆕 NUEVOS CAMPOS PROPORCIONALES
    start_date: null,
    end_date: null,
    corresponding_month: null,
    is_proportional: 0,

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
    private billsUtilService: BillsUtilService,
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
   *NUEVO: Se ejecuta cuando cambia el estado de pago
   * Si marca como "pagado", pone la fecha de hoy automáticamente
   */
  onPaymentStatusChange() {
    this.billsUtilService.handlePaymentStatusChange(this.bill);
  }

  /**
   *Se ejecuta cuando cambia el tipo de facturación (normal/proporcional)
   */
  onBillingTypeChange(): void {
    if (this.bill.is_proportional === 0) {
      // Si cambia a normal, limpiar campos proporcionales
      this.bill.start_date = null;
      this.bill.end_date = null;
      this.simulationResult = null;
    }
    this.calculateTotal();
  }

  /**
   *🆕 Se ejecuta cuando cambian las fechas proporcionales
   */
  onProportionalDatesChange(): void {
    //if (this.bill.is_proportional === 1 && this.bill.start_date && this.bill.end_date) {
    if (this.bill.is_proportional == 1 && this.bill.start_date && this.bill.end_date) {
      this.simulateProportionalBilling();
    } else {
      this.calculateTotal();
    }
  }

  /**
   *🆕 Simula facturación proporcional
   */
  simulateProportionalBilling(): void {
    if (!this.bill.start_date || !this.bill.end_date || !this.bill.tax_base) {
      return;
    }

    this.isSimulating = true;
    const simulation: ProportionalSimulation = {
      tax_base: this.bill.tax_base,
      iva: this.bill.iva || 0,
      irpf: this.bill.irpf || 0,
      start_date: this.bill.start_date,
      end_date: this.bill.end_date
    };

    this.billsServices.simulateProportionalBilling(simulation).subscribe({
      next: (result) => {
        this.simulationResult = result;
        this.bill.total = result.total;
        this.isSimulating = false;
      },
      error: (e: HttpErrorResponse) => {
        this.isSimulating = false;
        this.simulationResult = null;
      }
    });
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
   * Calcula automáticamente el total basado en base imponible, IVA e IRPF
   * Fórmula fiscal: Total = Base + (Base × IVA%) - (Base × IRPF%)
   * Calcula automáticamente el total basado en tipo de facturación
   *
   * @example
   * Base: 1000€, IVA: 21%, IRPF: 15%
   * Total = 1000 + (1000 × 0.21) - (1000 × 0.15) = 1000 + 210 - 150 = 1060€
   */
  calculateTotal(): void {
    this.billsUtilService.calculateTotal(this.bill, () => this.onProportionalDatesChange())
  }


  /**
   *NUEVO: Inicializa valores por defecto para los campos de pago
   */
  initializePaymentDefaults() {
    // Si el usuario marca como "pagado", establecer fecha de hoy
    this.billsUtilService.initializePaymentDefaults(this.bill);
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
