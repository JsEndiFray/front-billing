import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {CurrencyPipe} from '@angular/common';
import {Bill, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS} from '../../../interface/bills-interface';
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
import {PaymentUtilService} from '../../../core/services/payment-util-services/payment-util.service';

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
  //variables
  owners: Owners[] = [];
  clients: Clients[] = [];
  estates: Estates[] = [];
  originalBills: Bill[] = [];
  isEditMode: boolean = false;

  //LABELS PARA LOS NUEVOS CAMPOS DE PAGO
  paymentStatusLabels = PAYMENT_STATUS_LABELS;
  paymentMethodLabels = PAYMENT_METHOD_LABELS;


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private billsService: BillsService,
    private ownersServices: OwnersService,
    private clientsServices: ClientsService,
    private estatesServices: EstatesService,
    private billsValidatorService: BillsValidatorService,
    private paymentUtilServices: PaymentUtilService,
  ) {
  }

  ngOnInit(): void {
    this.loadOwners();
    this.loadClients();
    this.loadEstates();
    this.loadOriginalBills();

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.isEditMode = true;
        this.billsService.getBillById(id).subscribe({
          next: (data) => {
            this.bill = data;
            // Formatear la fecha para el input HTML
            if (this.bill.date) {
              // Convertir de ISO a YYYY-MM-DD
              const date = new Date(this.bill.date);
              this.bill.date = date.toISOString().split('T')[0];
            }
            //FORMATEAR FECHA DE PAGO SI EXISTE
            if (this.bill.payment_date) {
              const paymentDate = new Date(this.bill.payment_date);
              this.bill.payment_date = paymentDate.toISOString().split('T')[0];
            }

          }, error: (e: HttpErrorResponse) => {
          }
        })
      }
    });
  };

  //NUEVO: Manejo del cambio de estado de pago
  onPaymentStatusChange() {
    this.paymentUtilServices.handlePaymentStatusChange(this.bill);
  }

  loadOwners() {
    this.ownersServices.getOwners().subscribe({
      next: (data) => {
        this.owners = data;
      }, error: (e: HttpErrorResponse) => {
      }
    })
  }

  loadClients() {
    this.clientsServices.getClients().subscribe({
      next: (data) => {
        this.clients = data;
      }, error: (e: HttpErrorResponse) => {
      }
    })
  }

  loadEstates() {
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
    const taxBase = this.bill.tax_base || 0;
    const iva = this.bill.iva || 0;
    const irpf = this.bill.irpf || 0;

    this.bill.total = taxBase + iva - irpf;
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
    }
    //validaciones
    const cleanData = this.billsValidatorService.cleanBillsData(this.bill);

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
          this.bill = data;
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
