import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {
  BILLING_TYPE_LABELS,
  COLLECTION_METHOD_LABELS,
  COLLECTION_STATUS_LABELS, Invoice,
  ProportionalSimulation,
  ProportionalSimulationResponse
} from '../../../../interface/invoices-issued-interface';
import {
  InvoicesIssuedValidatorService
} from '../../../../core/services/validator-services/invoices-issued-validator.service';
import {Estates} from '../../../../interface/estates.interface';
import {Clients} from '../../../../interface/clientes-interface';
import {Owners} from '../../../../interface/owners-interface';
import {EstatesService} from '../../../../core/services/estates-services/estates.service';
import {HttpErrorResponse} from '@angular/common/http';
import {ClientsService} from '../../../../core/services/clients-services/clients.service';
import {InvoicesIssuedService} from '../../../../core/services/invoices-issued-service/invoices-issued.service';
import Swal from 'sweetalert2';
import {OwnersService} from '../../../../core/services/owners-services/owners.service';
import {Router} from '@angular/router';
import {
  InvoicesIssuedUtilService
} from '../../../../core/services/invoices-issued-util-services/invoices-issued-util.service';
import {CurrencyPipe} from '@angular/common';

/**
 * Componente para registrar nuevas facturas
 * Permite crear facturas con cálculo automático de totales y validaciones fiscales
 */
@Component({
  selector: 'app-invoices-issued-register',
  imports: [
    FormsModule,
    CurrencyPipe
  ],
  templateUrl: './invoices-issued-register.component.html',
  styleUrl: './invoices-issued-register.component.css'
})
export class InvoicesIssuedRegisterComponent implements OnInit {

  // Listas para los selectores del formulario
  estates: Estates[] = [];     // Lista de propiedades disponibles
  clients: Clients[] = [];     // Lista de clientes disponibles
  owners: Owners[] = [];       // Lista de propietarios disponibles

  //LABELS PARA LOS NUEVOS CAMPOS DE PAGO Y PARA FACTURACIÓN PROPORCIONAL
  collectionStatusLabels = COLLECTION_STATUS_LABELS;
  collectionMethodLabels = COLLECTION_METHOD_LABELS;
  billingTypeLabels = BILLING_TYPE_LABELS;

  //VARIABLES PARA FACTURACIÓN PROPORCIONAL
  isSimulating: boolean = false;
  simulationResult: ProportionalSimulationResponse | null = null;

  // Objeto que guarda los datos de la nueva factura
  invoice: Invoice = {
    id: null,
    invoice_number: '',
    estates_id: null,
    clients_id: null,
    owners_id: null,
    ownership_percent: null,
    invoice_date: '',
    tax_base: null,
    iva: null,
    irpf: null,
    total: null,
    is_refund: 0,
    original_invoice_id: null,
    original_invoice_number: null, // Se genera en backend para abonos
    // CAMPOS DE COBRO CON VALORES POR DEFECTO
    collection_status: 'pending',
    collection_method: 'transfer',
    collection_date: null,
    collection_notes: '',
    collection_reference: null, // Nueva propiedad

    // CAMPOS PROPORCIONALES
    start_date: '',
    end_date: '',
    corresponding_month: null,
    is_proportional: 0,

    created_at: '',
    updated_at: '',
  }

  constructor(
    private invoicesIssuedValidatorService: InvoicesIssuedValidatorService,
    private estateServices: EstatesService,
    private clientsServices: ClientsService,
    private ownerServices: OwnersService,
    private invoicesIssuedService: InvoicesIssuedService,
    private router: Router,
    private invoicesIssuedUtilService: InvoicesIssuedUtilService,
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
    // Inicializar propiedades de cobro con valores por defecto
    this.invoicesIssuedUtilService.initializeCollectionDefaults(this.invoice);
  }

  /**
   * Maneja el cambio de estado de cobro
   * Si marca como "cobrado" sin fecha, pone la fecha actual
   */
  onCollectionStatusChange() {
    this.invoicesIssuedUtilService.handleCollectionStatusChange(this.invoice);
  }

  /**
   * Se ejecuta cuando cambia el tipo de facturación (normal/proporcional)
   */
  onBillingTypeChange(): void {
    if (!this.invoice) return;
    this.invoice.is_proportional = +(this.invoice.is_proportional ?? 0);
    if (this.invoice.is_proportional === 0) {
      // Si cambia a normal, limpiar campos proporcionales
      this.invoice.start_date = '';
      this.invoice.end_date = '';
      this.simulationResult = null;
    }
    this.calculateTotal();
  }

  /**
   * Se ejecuta cuando cambian las fechas proporcionales
   */
  onProportionalDatesChange(): void {
    if (!this.invoice) return;

    if (this.invoice.is_proportional === 1 && this.invoice.start_date && this.invoice.end_date) {
      this.simulateProportionalBilling();
    } else {
      this.calculateTotal();
    }
  }


  /**
   * Simula facturación proporcional
   */
  simulateProportionalBilling(): void {
    if (!this.invoice.start_date || !this.invoice.end_date || this.invoice.tax_base === null || this.invoice.tax_base === undefined) {
      return;
    }
    this.isSimulating = true;
    const simulation: ProportionalSimulation = {
      tax_base: this.invoice.tax_base,
      iva: this.invoice.iva || 0,
      irpf: this.invoice.irpf || 0,
      start_date: this.invoice.start_date,
      end_date: this.invoice.end_date
    };
    this.invoicesIssuedService.simulateProportionalBilling(simulation).subscribe({
      next: (result) => {
        this.simulationResult = result;
        this.invoice.total = result.total;
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
   */
  calculateTotal(): void {
    this.invoicesIssuedUtilService.calculateTotal(this.invoice, () => this.onProportionalDatesChange());
  }

  /**
   * Se ejecuta cuando cambia la base imponible. Recalcula el total automáticamente.
   */
  onTaxBaseChange(): void {
    this.calculateTotal();
  }

  /**
   * Se ejecuta cuando cambia el porcentaje de IVA. Recalcula el total automáticamente.
   */
  onIvaChange(): void {
    this.calculateTotal();
  }


  /**
   * Se ejecuta cuando cambia el porcentaje de IRPF. Recalcula el total automáticamente.
   */
  onIrpfChange(): void {
    this.calculateTotal();
  }

  /**
   * Registra una nueva factura en el sistema
   * Valida los datos antes de enviar al servidor
   */
  registerInvoice() {
    // Limpiar espacios y preparar datos
    const invoiceToSend = this.invoicesIssuedUtilService.formatInvoiceDatesForBackend(this.invoice);

    // Validar factura completa (obligatorios + numéricos)
    const validation = this.invoicesIssuedValidatorService.validateInvoice(invoiceToSend);
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error!',
        text: validation.message, // Mensaje del validador
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }
    // Enviar datos al servidor para crear la factura
    this.invoicesIssuedService.createInvoice(invoiceToSend).subscribe({
      next: (data) => {
        Swal.fire({
          title: "Se ha registrado correctamente.",
          text: `Factura creada con estado: ${this.collectionStatusLabels[this.invoice.collection_status || 'pending']}`,
          icon: "success",
          draggable: true
        });
        // Redirigir a la lista después del registro exitoso
        this.router.navigate(['/dashboards/invoices-issued/list'])
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  };

  goBack() {
    this.router.navigate(['/dashboards/invoices-issued/list'])
  }
}
