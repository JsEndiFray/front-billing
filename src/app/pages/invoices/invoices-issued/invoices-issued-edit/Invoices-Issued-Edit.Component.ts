import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {CurrencyPipe} from '@angular/common';
import {
  Invoice,
  ProportionalSimulation,
  ProportionalSimulationResponse
} from '../../../../interfaces/invoices-issued-interface';
import {Owners} from '../../../../interfaces/owners-interface';
import {Clients} from '../../../../interfaces/clientes-interface';
import {Estates} from '../../../../interfaces/estates-interface';
import {InvoicesIssuedService} from '../../../../core/services/invoices-issued-service/invoices-issued.service';
import {HttpErrorResponse} from '@angular/common/http';
import {OwnersService} from '../../../../core/services/owners-services/owners.service';
import {ClientsService} from '../../../../core/services/clients-services/clients.service';
import {EstatesService} from '../../../../core/services/estates-services/estates.service';
import Swal from 'sweetalert2';
import {DataFormatPipe} from '../../../../shared/pipe/data-format.pipe';
import {InvoicesUtilService} from '../../../../core/services/shared-services/invoices-Util.service';
import {
  BILLING_TYPE_LABELS,
  COLLECTION_METHOD_LABELS, COLLECTION_STATUS_LABELS
} from '../../../../shared/Collection-Enum/collection-enum';
import {ValidatorService} from '../../../../core/services/validator-services/validator.service';
import {CalculableInvoice} from '../../../../interfaces/calculate-interface';

@Component({
  selector: 'app-invoices-issued-edit',
  imports: [
    CurrencyPipe,
    DataFormatPipe,
    ReactiveFormsModule
  ],
  templateUrl: './Invoices-Issued-Edit.Component.html',
  styleUrl: './Invoices-Issued-Edit.Component.css'
})
export class InvoicesIssuedEditComponent implements OnInit {

  // ==========================================
  // PROPIEDADES DEL FORMULARIO
  // ==========================================

  // Formulario reactivo principal
  invoiceForm: FormGroup;

  //variables
  owners: Owners[] = [];
  clients: Clients[] = [];
  estates: Estates[] = [];
  originalInvoices: Invoice[] = [];

  //LABELS PARA LOS NUEVOS CAMPOS DE PAGO
  collectionStatusLabels = COLLECTION_STATUS_LABELS;
  collectionMethodLabels = COLLECTION_METHOD_LABELS;
  billingTypeLabels = [...BILLING_TYPE_LABELS];

  //VARIABLES PARA FACTURACIÓN PROPORCIONAL
  // Estado de envío
  isSubmitting: boolean = false;
  isSimulating: boolean = false;
  simulationResult: ProportionalSimulationResponse | null = null;


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private invoicesIssuedService: InvoicesIssuedService,
    private ownersServices: OwnersService,
    private clientsServices: ClientsService,
    private estatesServices: EstatesService,
    private validatorService: ValidatorService,
    protected invoicesUtilService: InvoicesUtilService,
    private fb: FormBuilder,
  ) {
    this.invoiceForm = this.fb.group({
      // Identificación
      id: [null],
      invoice_number: [''],
      invoice_date: ['', [Validators.required]],

      // Entidades relacionadas
      estates_id: ['', [Validators.required]],
      clients_id: ['', [Validators.required]],
      owners_id: ['', [Validators.required]],

      // Cálculos financieros
      tax_base: ['', [Validators.required, Validators.min(0.01)]],
      iva: [21, [Validators.min(0), Validators.max(100)]],
      irpf: [0, [Validators.min(0), Validators.max(100)]],
      total: [0],

      // Facturación proporcional
      is_proportional: ['0'],
      corresponding_month: [''],
      start_date: [''],
      end_date: [''],

      // Información de cobro
      collection_status: ['pending'],
      collection_method: ['transfer'],
      collection_date: [{value: '', disabled: true}],
      collection_notes: [''],
      collection_reference: [{value: '', disabled: true}],

      // Campos adicionales para Edit
      is_refund: [0],
      original_invoice_id: [null],
      original_invoice_number: [null]
    });
  }

  ngOnInit(): void {
    this.getListOwners();
    this.getListClients();
    this.getListEstate();
    this.loadOriginalInvoices();

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.invoicesIssuedService.getInvoiceById(id).subscribe({
          next: (data) => {
            this.invoiceForm.patchValue({
              ...data,
              // Formatear las fechas para los inputs HTML (YYYY-MM-DD)
              invoice_date: this.invoicesUtilService.formatDateForInput(data.invoice_date),
              collection_date: this.invoicesUtilService.formatDateForInput(data.collection_date),
              // Formatear fechas proporcionales si existen
              start_date: this.invoicesUtilService.formatDateForInput(data.start_date),
              end_date: this.invoicesUtilService.formatDateForInput(data.end_date),
              // Asegurar que is_proportional sea string como en Register
              is_proportional: data.is_proportional || 0,
              is_refund: data.is_refund || 0
            });
            // Si es proporcional y las fechas están cargadas, simular para mostrar detalles
            if (data.is_proportional && data.start_date && data.end_date) {
              this.simulateProportionalBilling();
            }
          },
          error: (e: HttpErrorResponse) => {
          }
        })
      }
    });
  };

  // ==========================================
  // MÉTODOS DE CARGA DE DATOS
  // ==========================================


  loadOriginalInvoices() {
    this.invoicesIssuedService.getAllInvoicesIssued().subscribe({
      next: (data) => {
        this.originalInvoices = data.filter(invoice => !invoice.is_refund);
      }, error: (e: HttpErrorResponse) => {
        this.originalInvoices = [];
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

  getListOwners() {
    this.ownersServices.getOwners().subscribe({
      next: (data: Owners[]) => {
        this.owners = data;
      }, error: (e: HttpErrorResponse) => {
        this.owners = [];
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

  // ==========================================
  // MÉTODOS DE VALIDACIÓN
  // ==========================================

  /**
   * Verifica si un campo del formulario es inválido y debe mostrar mensaje de error
   * @param fieldName - Nombre del campo a validar
   * @returns true si el campo es inválido Y ha sido tocado o modificado por el usuario
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.invoiceForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    return this.validatorService.getErrorMessage(this.invoiceForm, fieldName);
  }


  // ==========================================
  // MÉTODOS DE CÁLCULO
  // ==========================================

  /**
   * Calcula automáticamente los importes cuando cambian los valores
   */
  calculateAmounts(): void {
    const formValues = this.invoiceForm.value;

    if (formValues.is_proportional === "1") {

    } else {
      // Cálculo normal
      const taxBase = parseFloat(formValues.tax_base) || 0;
      const ivaPercent = parseFloat(formValues.iva) || 0;
      const irpfPercent = parseFloat(formValues.irpf) || 0;

      const total = taxBase + (taxBase * ivaPercent / 100) - (taxBase * irpfPercent / 100);

      // Actualizar el FormGroup
      this.invoiceForm.patchValue({
        total: parseFloat(total.toFixed(2))
      });
    }
  }

  /**
   * Se ejecuta cuando cambia el tipo de facturación (normal/proporcional)
   */
  onBillingTypeChange(): void {
    const formValues = this.invoiceForm.value;


    if (formValues.is_proportional === "0") {
      // Si cambia a normal, limpiar campos proporcionales
      this.invoiceForm.patchValue({
        start_date: '',
        end_date: ''
      });
      this.simulationResult = null;
    }
    this.calculateAmounts();
  }


  /**
   * Se ejecuta cuando cambian las fechas proporcionales
   */
  onProportionalDatesChange(): void {
    const formValues = this.invoiceForm.value;

    if (formValues.is_proportional === "1" && formValues.start_date && formValues.end_date) {
      this.simulateProportionalBilling();
    }
  }

  /**
   * Simula facturación proporcional
   */
  simulateProportionalBilling(): void {
    const formValues = this.invoiceForm.value;

    if (!formValues.start_date || !formValues.end_date || !formValues.tax_base) {
      return;
    }

    this.isSimulating = true;
    const simulation: ProportionalSimulation = {
      tax_base: formValues.tax_base,
      iva: formValues.iva || 0,
      irpf: formValues.irpf || 0,
      start_date: formValues.start_date,
      end_date: formValues.end_date
    };

    this.invoicesIssuedService.simulateProportionalBilling(simulation).subscribe({
      next: (result) => {
        this.simulationResult = result;
        // Actualizar el total en el FormGroup
        this.invoiceForm.patchValue({
          total: result.total
        });
        this.isSimulating = false;
      },
      error: (e: HttpErrorResponse) => {
        this.isSimulating = false;
        this.simulationResult = null;
      }
    });
  }

  /**
   * Maneja el cambio de estado de cobro
   * Si marca como "cobrado" sin fecha, pone la fecha actual
   */
  onCollectionStatusChange(): void {
    const status = this.invoiceForm.get('collection_status')?.value;
    const dateControl = this.invoiceForm.get('collection_date');
    const referenceControl = this.invoiceForm.get('collection_reference');

    if (status === 'collected') {
      // habilitar campos
      dateControl?.enable();
      referenceControl?.enable();

      if (!dateControl?.value) {
        // Si no tiene fecha, asignar la actual
        this.invoiceForm.patchValue({
          collection_date: this.invoicesUtilService.getCurrentDateForInput()
        });
      }
    } else {
      // deshabilitar y limpiar campos
      dateControl?.disable();
      this.invoiceForm.patchValue({
        collection_date: '',
        collection_notes: '',
        collection_reference: ''
      });
    }
  }


  //========================
  //CRUD
  //========================

  updateInvoice(): void {
    const formValues = this.invoiceForm.getRawValue();

    if (!formValues.id) {
      Swal.fire({
        title: 'Error!',
        text: 'No se puede actualizar: ID de factura no válido',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    // Aplicar transformaciones si las necesitas
    this.validatorService.applyTransformations(this.invoiceForm, 'invoice');

    // Crear objeto Invoice para enviar
    const invoiceToSend: Invoice = {
      ...formValues,
      tax_base: parseFloat(formValues.tax_base) || 0,
      iva: parseFloat(formValues.iva) || 0,
      irpf: parseFloat(formValues.irpf) || 0,
      total: parseFloat(formValues.total) || 0,
      is_proportional: parseInt(formValues.is_proportional) || 0
    };

    // Formatear fechas para backend
    const invoiceFormatted = this.invoicesUtilService.formatInvoiceDatesForBackend(invoiceToSend);

    // Validar
    const validation = this.validatorService.validateInvoice(invoiceFormatted);
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error!',
        text: validation.message,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    // Enviar al servidor
    this.invoicesIssuedService.updateInvoice(formValues.id, invoiceFormatted).subscribe({
      next: (data) => {
        Swal.fire({
          title: 'Éxito!',
          text: `Factura actualizada con estado: ${this.invoicesUtilService.getStatusLabel(formValues.collection_status || 'pending')}`,
          icon: 'success',
          confirmButtonText: 'Ok'
        }).then(() => {
          this.goBack();
        });
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
        this.invoiceForm.markAllAsTouched();
      }
    });
  }

  goBack() {
    // Verificar si hay cambios sin guardar
    if (this.invoiceForm.dirty) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'Tienes cambios sin guardar que se perderán',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/dashboards/invoices-issued/list']);
        }
      });
    } else {
      this.router.navigate(['/dashboards/invoices-issued/list']);
    }
  }

}
