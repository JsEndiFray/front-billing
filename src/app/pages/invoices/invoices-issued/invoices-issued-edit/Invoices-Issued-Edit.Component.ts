import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {CurrencyPipe} from '@angular/common';
import {
  BILLING_TYPE_LABELS,
  COLLECTION_METHOD_LABELS,
  COLLECTION_STATUS_LABELS,
  Invoice,
  ProportionalSimulation,
  ProportionalSimulationResponse
} from '../../../../interface/invoices-issued-interface';
import {Owners} from '../../../../interface/owners-interface';
import {Clients} from '../../../../interface/clientes-interface';
import {Estates} from '../../../../interface/estates.interface';
import {InvoicesIssuedService} from '../../../../core/services/invoices-issued-service/invoices-issued.service';
import {HttpErrorResponse} from '@angular/common/http';
import {OwnersService} from '../../../../core/services/owners-services/owners.service';
import {ClientsService} from '../../../../core/services/clients-services/clients.service';
import {EstatesService} from '../../../../core/services/estates-services/estates.service';
import Swal from 'sweetalert2';
import {DataFormatPipe} from '../../../../shared/pipe/data-format.pipe';
import {
  InvoicesIssuedValidatorService
} from '../../../../core/services/validator-services/invoices-issued-validator.service';
import {
  InvoicesIssuedUtilService
} from '../../../../core/services/invoices-issued-util-services/invoices-issued-util.service';

@Component({
  selector: 'app-invoices-issued-edit',
  imports: [
    FormsModule,
    CurrencyPipe,
    DataFormatPipe
  ],
  templateUrl: './Invoices-Issued-Edit.Component.html',
  styleUrl: './Invoices-Issued-Edit.Component.css'
})
export class InvoicesIssuedEditComponent implements OnInit {

  //variables
  owners: Owners[] = [];
  clients: Clients[] = [];
  estates: Estates[] = [];
  originalInvoices: Invoice[] = [];
  isEditMode: boolean = false;

  //LABELS PARA LOS NUEVOS CAMPOS DE PAGO
  collectionStatusLabels = COLLECTION_STATUS_LABELS;
  collectionMethodLabels = COLLECTION_METHOD_LABELS;
  billingTypeLabels = BILLING_TYPE_LABELS;

  //VARIABLES PARA FACTURACIÓN PROPORCIONAL
  isSimulating: boolean = false;
  simulationResult: ProportionalSimulationResponse | null = null;


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
    original_invoice_number: null,
    // CAMPOS DE COBRO CON VALORES POR DEFECTO
    collection_status: 'pending',
    collection_method: 'transfer',
    collection_date: null,
    collection_notes: '',
    // CAMPOS PROPORCIONALES
    start_date: '',
    end_date: '',
    corresponding_month: null,
    is_proportional: 0,
    created_at: '',
    updated_at: '',
  };


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private invoicesIssuedService: InvoicesIssuedService,
    private ownersServices: OwnersService,
    private clientsServices: ClientsService,
    private estatesServices: EstatesService,
    private invoicesIssuedValidatorService: InvoicesIssuedValidatorService,
    private invoicesIssuedUtilService: InvoicesIssuedUtilService,
  ) {
  }

  ngOnInit(): void {
    this.getListOwners();
    this.getListClients();
    this.getListEstate();
    this.loadOriginalInvoices();

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.isEditMode = true;
        this.invoicesIssuedService.getInvoiceById(id).subscribe({
          next: (data) => {
            this.invoice = data;
            // Formatear las fechas para los inputs HTML (YYYY-MM-DD)
            this.invoice.invoice_date = this.invoicesIssuedUtilService.formatDateForInput(this.invoice.invoice_date);
            this.invoice.collection_date = this.invoicesIssuedUtilService.formatDateForInput(this.invoice.collection_date);
            // Formatear fechas proporcionales si existen
            this.invoice.start_date = this.invoicesIssuedUtilService.formatDateForInput(this.invoice.start_date);
            this.invoice.end_date = this.invoicesIssuedUtilService.formatDateForInput(this.invoice.end_date);
            // Si es proporcional y las fechas están cargadas, simular para mostrar detalles
            if (this.invoice.is_proportional && this.invoice.start_date && this.invoice.end_date && this.invoice.tax_base) {
              this.simulateProportionalBilling();
            }
          }, error: (e: HttpErrorResponse) => {
          }
        })
      }
    });
  };

  // Manejo del cambio de estado de cobro
  onCollectionStatusChange() {
    this.invoicesIssuedUtilService.handleCollectionStatusChange(this.invoice);
  }

  /**
   * Se ejecuta cuando cambia el tipo de facturación (normal/proporcional)
   */
  onBillingTypeChange(): void {
    if (this.invoice.is_proportional === 0) { // CAMBIO: 0 a false
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
    // CAMBIO: 1 a true
    if (this.invoice.is_proportional == 1 && this.invoice.start_date && this.invoice.end_date) {
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
      return; // No simular si faltan datos esenciales
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
  }

  getListOwners() {
    this.ownersServices.getOwners().subscribe({
      next: (data) => {
        this.owners = data;
      }, error: (e: HttpErrorResponse) => {
      }
    })
  }

  getListClients() {
    this.clientsServices.getClients().subscribe({
      next: (data) => {
        this.clients = data;
      }, error: (e: HttpErrorResponse) => {
      }
    })
  }

  getListEstate() {
    this.estatesServices.getAllEstate().subscribe({
      next: (data) => {
        this.estates = data;
      }, error: (e: HttpErrorResponse) => {
      }
    })
  }

  loadOriginalInvoices() {
    this.invoicesIssuedService.getAllInvoicesIssued().subscribe({
      next: (data) => {
        this.originalInvoices = data.filter(invoice => !invoice.is_refund);
      }, error: (e: HttpErrorResponse) => {
        this.originalInvoices = [];
      }
    })
  }

  calculateTotal() {
    this.invoicesIssuedUtilService.calculateTotal(this.invoice, () => this.onProportionalDatesChange())
  }

  updateInvoice() {
    if (!this.invoice.id) {
      Swal.fire({
        title: 'Error!',
        text: 'No se puede actualizar: ID de factura no válido',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    // Formatear las fechas antes de enviar al backend
    const invoiceWithFormattedDates = this.invoicesIssuedUtilService.formatInvoiceDatesForBackend(this.invoice); // CAMBIO: formatBillDatesForBackend a formatInvoiceDatesForBackend

    // Validaciones
    const validation = this.invoicesIssuedValidatorService.validateInvoice(invoiceWithFormattedDates);
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error!',
        text: validation.message, // Mensaje del validador
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    this.invoicesIssuedService.updateInvoice(this.invoice.id, invoiceWithFormattedDates).subscribe({
        next: (data) => {
          this.invoice = data; // Data ya es Invoice, no array
          Swal.fire({
            title: 'Éxito!',
            text: `Factura actualizada con estado: ${this.collectionStatusLabels[this.invoice.collection_status || 'pending']}`,
            icon: 'success',
            confirmButtonText: 'Ok'
          }).then(() => {
            this.goBack();
          });
          this.loadOriginalInvoices();
        }, error: (e: HttpErrorResponse) => {
        }
      }
    )
  }

  goBack() {
    this.router.navigate(['/dashboards/invoices-issued/list'])
  }

}
