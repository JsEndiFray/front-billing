import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {
  Invoice,
  ProportionalSimulation,
  ProportionalSimulationResponse
} from '../../../../interfaces/invoices-issued-interface';
import {
  InvoicesIssuedValidatorService
} from '../../../../core/services/validator-services/invoices-issued-validator.service';
import {Estates} from '../../../../interfaces/estates-interface';
import {Clients} from '../../../../interfaces/clientes-interface';
import {Owners} from '../../../../interfaces/owners-interface';
import {EstatesService} from '../../../../core/services/estates-services/estates.service';
import {HttpErrorResponse} from '@angular/common/http';
import {ClientsService} from '../../../../core/services/clients-services/clients.service';
import {InvoicesIssuedService} from '../../../../core/services/invoices-issued-service/invoices-issued.service';
import Swal from 'sweetalert2';
import {OwnersService} from '../../../../core/services/owners-services/owners.service';
import {Router} from '@angular/router';
import {
  InvoicesUtilService
} from '../../../../core/services/shared-services/invoices-Util.service';
import {CurrencyPipe} from '@angular/common';
import {
  BILLING_TYPE_LABELS,
  COLLECTION_METHOD_LABELS, COLLECTION_STATUS_LABELS,
} from '../../../../shared/Collection-Enum/collection-enum';

/**
 * Componente para registrar nuevas facturas
 * Permite crear facturas con cálculo automático de totales y validaciones fiscales
 */
@Component({
  selector: 'app-invoices-issued-register',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe
  ],
  templateUrl: './invoices-issued-register.component.html',
  styleUrl: './invoices-issued-register.component.css'
})
export class InvoicesIssuedRegisterComponent implements OnInit {

  // ==========================================
  // PROPIEDADES DEL FORMULARIO
  // ==========================================

  // Formulario reactivo principal
  invoiceForm: FormGroup;


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

  constructor(
    private invoicesIssuedValidatorService: InvoicesIssuedValidatorService,
    private estateServices: EstatesService,
    private clientsServices: ClientsService,
    private ownerServices: OwnersService,
    private invoicesIssuedService: InvoicesIssuedService,
    private router: Router,
    protected invoicesUtilService: InvoicesUtilService,
    private fb: FormBuilder,
  ) {
    this.invoiceForm = this.fb.group({
      // Identificación
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
      collection_date: [''],
      collection_notes: [''],
      collection_reference: ['']
    })
  }

  /**
   * Se ejecuta al cargar el componente
   * Carga todas las listas necesarias para los selectores
   */
  ngOnInit(): void {
    this.getListEstate();
    this.getListClients();
    this.getListOwners();
    this.setDefaultValues();
  }

  // ==========================================
  // MÉTODOS DE CARGA DE DATOS
  // ==========================================

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

  // ==========================================
  // MÉTODOS DE VALIDACIÓN
  // ==========================================

  /**
   * Verifica si un campo es inválido para mostrar errores
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.invoiceForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Establece valores por defecto en el formulario
   */
  setDefaultValues(): void {
    this.invoiceForm.patchValue({
      invoice_date: this.invoicesUtilService.getCurrentDateForInput(),
      collection_status: 'pending',
      collection_method: 'transfer',
      is_proportional: "0",
      iva: 21,
      irpf: 13
    });
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
    const formValues = this.invoiceForm.value;

    if (formValues.collection_status === 'collected') {
      // Si marca como cobrado y no tiene fecha, poner fecha de hoy
      if (!formValues.collection_date) {
        this.invoiceForm.patchValue({
          collection_date: this.invoicesUtilService.getCurrentDateForInput()
        });
      }
    } else {
      // Si marca como pendiente, limpiar campos de cobro
      this.invoiceForm.patchValue({
        collection_date: '',
        collection_reference: '',
        collection_notes: ''
      });
    }
  };

  //=====
  //CRUD
  //=====
  /**
   * Registra una nueva factura en el sistema
   * Valida los datos antes de enviar al servidor
   */
  registerInvoice(): void {
    if (this.invoiceForm.valid) {
      // Obtener valores del FormGroup
      const formValues = this.invoiceForm.value;

      // Crear objeto Invoice para enviar
      const invoiceToSend: Invoice = {
        ...formValues,
        // Asegurar que los números estén en formato correcto
        tax_base: parseFloat(formValues.tax_base) || 0,
        iva: parseFloat(formValues.iva) || 0,
        irpf: parseFloat(formValues.irpf) || 0,
        total: parseFloat(formValues.total) || 0,
        is_proportional: parseInt(formValues.is_proportional) || 0
      };

      // Limpiar espacios y preparar fechas
      const invoiceFormatted = this.invoicesUtilService.formatInvoiceDatesForBackend(invoiceToSend);

      // Validar factura completa
      const validation = this.invoicesIssuedValidatorService.validateInvoice(invoiceFormatted);
      if (!validation.isValid) {
        Swal.fire({
          title: 'Error!',
          text: validation.message,
          icon: 'error',
          confirmButtonText: 'Ok'
        });
        return;
      }

      // Enviar datos al servidor
      this.invoicesIssuedService.createInvoice(invoiceFormatted).subscribe({
        next: (data) => {
          Swal.fire({
            title: "Se ha registrado correctamente.",
            text: `Factura creada con estado: ${this.invoicesUtilService.getStatusLabel(formValues.collection_status || 'pending')}`,
            icon: "success",
            draggable: true
          });
          this.router.navigate(['/dashboards/invoices-issued/list']);
        },
        error: (e: HttpErrorResponse) => {
          // Error manejado por interceptor
        }
      });
    } else {
      // Marcar campos como tocados para mostrar errores
      this.invoiceForm.markAllAsTouched();
    }
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
