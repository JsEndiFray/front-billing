import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {CurrencyPipe} from '@angular/common';
import {
  Bill,
  BILLING_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS, ProportionalSimulation, ProportionalSimulationResponse
} from '../../../interface/bills-interface';
import {Owners} from '../../../interface/owners-interface';
import {Clients} from '../../../interface/clientes-interface';
import {Estates} from '../../../interface/estates.interface';
import {BillsService} from '../../../core/services/bills-services/bills.service';
import {HttpErrorResponse} from '@angular/common/http';
import {OwnersService} from '../../../core/services/owners-services/owners.service';
import {ClientsService} from '../../../core/services/clients-services/clients.service';
import {EstatesService} from '../../../core/services/estates-services/estates.service';
import Swal from 'sweetalert2';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import {BillsValidatorService} from '../../../core/services/validator-services/bills-validator.service';
import {BillsUtilService} from '../../../core/services/bills-util-services/Bills-Util-Service';

@Component({
  selector: 'app-bills-edit',
  imports: [
    FormsModule,
    CurrencyPipe,
    DataFormatPipe
  ],
  templateUrl: './bills-edit.component.html',
  styleUrl: './bills-edit.component.css'
})
export class BillsEditComponent implements OnInit {

  //variables
  owners: Owners[] = [];
  clients: Clients[] = [];
  estates: Estates[] = [];
  originalBills: Bill[] = [];
  isEditMode: boolean = false;

  //LABELS PARA LOS NUEVOS CAMPOS DE PAGO
  paymentStatusLabels = PAYMENT_STATUS_LABELS;
  paymentMethodLabels = PAYMENT_METHOD_LABELS;
  billingTypeLabels = BILLING_TYPE_LABELS;

  //VARIABLES PARA FACTURACIÓN PROPORCIONAL
  isSimulating: boolean = false;
  simulationResult: ProportionalSimulationResponse | null = null;


  bill: Bill = {
    bill_number: '',
    estates_id: null,
    clients_id: null,
    owners_id: null,
    ownership_percent: null,
    date: '',
    tax_base: null,
    iva: null,
    irpf: null,
    total: null,
    is_refund: null,
    original_bill_id: null,
    original_bill_number: null,
    //AGREGAR CAMPOS DE PAGO CON VALORES POR DEFECTO
    payment_status: 'pending',
    payment_method: 'transfer',
    payment_date: null,
    payment_notes: '',
    date_create: '',
    date_update: ''
  };


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private billsService: BillsService,
    private ownersServices: OwnersService,
    private clientsServices: ClientsService,
    private estatesServices: EstatesService,
    private billsValidatorService: BillsValidatorService,
    private billsUtilService: BillsUtilService,
  ) {
  }

  ngOnInit(): void {
    this.getListOwners();
    this.getListClients();
    this.getListEstate();
    this.loadOriginalBills();

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.isEditMode = true;
        this.billsService.getBillById(id).subscribe({
          next: (data) => {
            this.bill = data[0];
            // Formatear la fecha para el input HTML - Convertir de ISO a YYYY-MM-DD
            //FORMATEAR FECHA DE PAGO SI EXISTE
            this.bill.date = this.billsUtilService.formatDateForInput(this.bill.date);
            this.bill.payment_date = this.billsUtilService.formatDateForInput(this.bill.payment_date);
          }, error: (e: HttpErrorResponse) => {
          }
        })
      }
    });
  };

  //NUEVO: Manejo del cambio de estado de pago
  onPaymentStatusChange() {
    this.billsUtilService.handlePaymentStatusChange(this.bill);
  }

  /**
   * Se ejecuta cuando cambia el tipo de facturación (normal/proporcional)
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
   * Se ejecuta cuando cambian las fechas proporcionales
   */
  onProportionalDatesChange(): void {
    if (this.bill.is_proportional == 1 && this.bill.start_date && this.bill.end_date) {
      this.simulateProportionalBilling();
    } else {
      this.calculateTotal();
    }
  }

  /**
   * Simula facturación proporcional
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

    this.billsService.simulateProportionalBilling(simulation).subscribe({
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

  loadOriginalBills() {
    this.billsService.getAllBills().subscribe({
      next: (data) => {
        this.originalBills = data.filter(bill => bill.is_refund === 0);
      }, error: (e: HttpErrorResponse) => {
        this.originalBills = [];
      }
    })
  }

  calculateTotal() {
    this.billsUtilService.calculateTotal(this.bill, () => this.onProportionalDatesChange())
  }

  updateBill() {
    if (!this.bill.id) {
      Swal.fire({
        title: 'Error!',
        text: 'No se puede actualizar: ID de factura no válido',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    };

    //Formatear las fechas antes de enviar al backend
    const billWithFormattedDates = this.billsUtilService.formatBillDatesForBackend(this.bill);

    //validaciones
    const cleanData = this.billsValidatorService.cleanBillsData(billWithFormattedDates);

    //VALIDAR CAMPOS REQUERIDOS
    const validation = this.billsValidatorService.validateRequiredFields(cleanData);
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error!',
        text: validation.message,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }
    this.billsService.updateBills(this.bill.id, cleanData).subscribe({
        next: (data) => {
          this.bill = data[0];
          Swal.fire({
            title: 'Éxito!',
            text: `Factura actualizada con estado: ${this.paymentStatusLabels[this.bill.payment_status || 'pending']}`,
            icon: 'success',
            confirmButtonText: 'Ok'
          }).then(() => {
            this.goBack();
          });
          this.loadOriginalBills();
        }, error: (e: HttpErrorResponse) => {
        }
      }
    )
  }

  goBack() {
    this.router.navigate(['/dashboard/bills/list'])
  }

}
