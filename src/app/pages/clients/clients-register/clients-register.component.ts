import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import Swal from 'sweetalert2';
import {Clients} from '../../../interfaces/clientes-interface';
import {Router} from '@angular/router';
import {ClientsService} from '../../../core/services/clients-services/clients.service';
import {HttpErrorResponse} from '@angular/common/http';
import {ValidatorService} from '../../../core/services/validator-services/validator.service';

/**
 * Componente para registrar nuevos clientes con tipos dinámicos
 * Maneja particulares, autónomos y empresas con administradores múltiples
 */
@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  providers: [],
  templateUrl: './clients-register.component.html',
  styleUrl: './clients-register.component.css'
})
export class ClientsRegisterComponent implements OnInit {
  // ==========================================
  // PROPIEDADES DE FORMULARIOS MÚLTIPLES
  // ==========================================

  //extraer los datos del cliente principal
  clientForm: FormGroup;
  // Lista de administradores para empresas (solo si es empresa)
  administratorForms: FormGroup[] = [];

  // ID de la empresa creada (para vincular administradores)
  createdCompanyId: number | null | undefined = null;


  constructor(
    private validatorService: ValidatorService,
    private router: Router,
    private clientsService: ClientsService,
    private fb: FormBuilder
  ) {
    this.clientForm = this.fb.group({
      type_client: ['', Validators.required],
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      company_name: [''],
      identification: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],
      postal_code: ['', [Validators.required, Validators.pattern('[0-9]{5}')]],
      location: ['', Validators.required],
      province: ['', Validators.required],
      country: ['ESPAÑA', Validators.required],
      date_create: [''],
      date_update: [''],
      parent_company_id: [null],
      relationship_type: [undefined]
    })
  }

  /**
   * Se ejecuta al cargar el componente
   * Genera un CIF válido para pruebas de desarrollo
   */
  ngOnInit(): void {
    // Generar CIF válido para pruebas
    console.log('CIF válido generado:', this.validatorService.generateValidCIF());
  }

  /**
   * Selecciona el tipo de cliente y ajusta los campos
   * Limpia datos específicos según el tipo seleccionado
   */
  selectClientType(type: string): void {
    this.clientForm.patchValue({
      type_client: type,
      company_name: '',
      parent_company_id: null,
      relationship_type: undefined

    })

    // Limpiar administradores si cambia de empresa
    if (type !== 'empresa') {
      this.administratorForms = [];
    }

    // Los autónomos pueden ser administradores por defecto
    if (type === 'autonomo') {
      this.clientForm.patchValue({
        relationship_type: 'administrator'
      })

    }
  }

  /**
   * Actualiza automáticamente el nombre de la empresa
   * Se ejecuta cuando cambian nombre o apellidos en empresas
   */
  updateCompanyName(): void {
    // Obtiene todos los valores actuales del formulario
    const formValue = this.clientForm.value;
    // Verifica si el tipo de cliente es 'empresa'
    if (formValue.type_client === 'empresa') {
      // Combina el nombre y apellido, eliminando espacios extras
      const companyName = `${formValue.name} ${formValue.lastname}`.trim();
      // Actualiza el campo 'company_name' del formulario con el nuevo valor
      this.clientForm.patchValue({
        company_name: companyName
      });
    }
  }

  /**
   * Devuelve el placeholder apropiado según el tipo de cliente
   * CIF para empresas, NIF/NIE para particulares y autónomos
   */
  getIdentificationPlaceholder(): string {
    const clientType = this.clientForm.get('type_client')?.value;
    switch (clientType) {
      case 'empresa':
        return 'CIF (ej: A12345674)';
      case 'particular':
      case 'autonomo':
        return 'NIF, NIE o Pasaporte';
      default:
        return 'Identificación';
    }
  }

  /**
   * Añade un nuevo administrador a la lista
   * Solo disponible para empresas
   */
  addAdministrator(): void {
    // Crear FormGroup para el nuevo administrador
    const adminForm = this.fb.group({
      id: [null],
      type_client: ['autonomo'],
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      company_name: [''],
      identification: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],
      postal_code: ['', [Validators.required, Validators.maxLength(5)]],
      location: ['', Validators.required],
      province: ['', Validators.required],
      country: ['ESPAÑA', Validators.required],
      date_create: [''],
      date_update: [''],
      parent_company_id: [null],
      relationship_type: ['administrator']
    });

    this.administratorForms.push(adminForm);

  }

  /**
   * Elimina un administrador de la lista
   */
  removeAdministrator(index: number): void {
    this.administratorForms.splice(index, 1);
  }

  /**
   * Valida los datos de un administrador
   * Muestra mensaje de error si la validación falla
   */
  validateAdministrator(adminForm: FormGroup, index: number): boolean {

    // Primero validar que el FormGroup sea válido
    if (!adminForm.valid) {
      Swal.fire({
        title: `Error en administrador ${index + 1}`,
        text: 'Por favor, complete todos los campos requeridos',
        icon: 'error'
      });
      return false;
    }

    this.validatorService.applyTransformations(adminForm, 'client');

    // Crear objeto Clients desde el FormGroup para validación adicional
    const adminValues = adminForm.value;
    const adminToValidate: Clients = {
      id: null,
      type_client: 'autonomo',
      name: adminValues.name,
      lastname: adminValues.lastname,
      company_name: '',
      identification: adminValues.identification,
      phone: adminValues.phone,
      email: adminValues.email,
      address: adminValues.address,
      postal_code: adminValues.postal_code,
      location: adminValues.location,
      province: adminValues.province,
      country: adminValues.country,
      date_create: '',
      date_update: '',
      parent_company_id: null,
      relationship_type: 'administrator'
    };


    const validation = this.validatorService.validateClient(adminToValidate);
    if (!validation.isValid) {
      Swal.fire({
        title: `Error en administrador ${index + 1}`,
        text: validation.message,
        icon: 'error'
      });
      return false;
    }
    return true;
  }

  /**
   * Crea el cliente principal y maneja la lógica de administradores
   * Flujo: validar cliente → crear cliente → crear administradores (si aplica)
   */
  createClient(): void {
    // Verificar que se haya seleccionado un tipo
    if (!this.clientForm.valid) {
      // Marcar todos los campos como tocados para mostrar errores
      this.clientForm.markAllAsTouched();
      Swal.fire({
        title: 'Error!',
        text: 'Debe seleccionar un tipo de cliente',
        icon: 'error'
      });
      return;
    }
    // Obtener valores del FormGroup
    const formValues = this.clientForm.value;

    // Verificar que se haya seleccionado un tipo
    if (!formValues.type_client) {
      Swal.fire({
        title: 'Error!',
        text: 'Debe seleccionar un tipo de cliente',
        icon: 'error'
      });
      return;
    }
    // Crear objeto Clients desde el FormGroup
    const clientToCreate: Clients = {
      id: null,
      type_client: formValues.type_client,
      name: formValues.name,
      lastname: formValues.lastname,
      company_name: formValues.company_name || '',
      identification: formValues.identification,
      phone: formValues.phone,
      email: formValues.email,
      address: formValues.address,
      postal_code: formValues.postal_code,
      location: formValues.location,
      province: formValues.province,
      country: formValues.country,
      date_create: '',
      date_update: '',
      parent_company_id: formValues.parent_company_id,
      relationship_type: formValues.relationship_type
    };

    //Aplicar transformaciones (mayúsculas, etc.)
    this.validatorService.applyTransformations(this.clientForm, 'client');

    const validation = this.validatorService.validateClient(clientToCreate);

    if (!validation.isValid) {
      Swal.fire({
        title: 'Error!',
        text: validation.message,
        icon: 'error'
      });
      return;
    }

    // Crear el cliente principal
    this.clientsService.createClientes(clientToCreate).subscribe({
      next: (data) => {
        this.createdCompanyId = data[0].id;

        // Si es empresa con administradores, crearlos después
        if (formValues.type_client === 'empresa' && this.administratorForms.length > 0) {
          this.createAdministrators();
        } else {
          // Si no hay administradores, mostrar éxito directamente
          Swal.fire({
            title: "Cliente registrado correctamente.",
            icon: "success",
            draggable: true
          });
          this.router.navigate(['/dashboards/clients/list']);
        }
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  //volver a tras
  goBack() {
    this.router.navigate(['/dashboards/clients/list'])
  }


  //===============================
  // Util para los administradores
  //===============================
  /**
   * Crea todos los administradores de la empresa
   * Proceso: validar todos → crear en paralelo → mostrar resultado
   */
  private createAdministrators(): void {
    // Validar todos los administradores antes de crear ninguno
    for (let i = 0; i < this.administratorForms.length; i++) {
      if (!this.validateAdministrator(this.administratorForms[i], i)) {
        return; // Si alguno falla, no crear ninguno
      }
    }

    // Crear todas las promesas para crear administradores en paralelo
    const adminPromises = this.administratorForms.map(adminForm => {
      const adminValues = adminForm.value;

      // Crear objeto Clients desde el FormGroup
      const adminToCreate: Clients = {
        id: null,
        type_client: 'autonomo',
        name: adminValues.name,
        lastname: adminValues.lastname,
        company_name: '',
        identification: adminValues.identification,
        phone: adminValues.phone,
        email: adminValues.email,
        address: adminValues.address,
        postal_code: adminValues.postal_code,
        location: adminValues.location,
        province: adminValues.province,
        country: adminValues.country,
        date_create: '',
        date_update: '',
        parent_company_id: this.createdCompanyId,  // Vincular con la empresa
        relationship_type: 'administrator'
      };

      // Los datos ya están limpios tras validateAdministrator()
      return this.clientsService.createClientes(adminToCreate).toPromise();
    });
    // Ejecutar todas las creaciones en paralelo
    Promise.all(adminPromises).then(
      (results: (Clients[] | undefined)[]) => {
        // Todos los administradores creados correctamente
        Swal.fire({
          title: 'Éxito!',
          text: `Empresa y ${this.administratorForms.length} administrador(es) creados`,
          icon: 'success'
        });
        this.router.navigate(['/dashboards/clients/list']);
      }
    ).catch(
      () => {
        // Error en algún administrador (empresa ya creada)
        Swal.fire({
          title: 'Advertencia',
          text: 'Empresa creada pero error al crear algunos administradores',
          icon: 'warning'
        });
        this.router.navigate(['/dashboards/clients/list']);
      }
    );
  }
}
