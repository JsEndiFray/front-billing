import {Component, OnInit} from '@angular/core';
import {ClientsService} from '../../../core/services/clients-services/clients.service';
import {ClientsValidatorService} from '../../../core/services/validator-services/clients-validator.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Clients} from '../../../interfaces/clientes-interface';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';

/**
 * Componente para editar clientes existentes
 * Maneja diferentes tipos de clientes y gestión de administradores para empresas
 */
@Component({
  selector: 'app-clients-edit',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './clients-edit.component.html',
  styleUrl: './clients-edit.component.css'
})
export class ClientsEditComponent implements OnInit {

  // ==========================================
  // PROPIEDADES DE FORMULARIOS MÚLTIPLES
  // ==========================================

  // clientes
  clientForm: FormGroup;
  //administradores
  newAdminForm: FormGroup;

  selectedAdminControl: FormControl;

  adminTypeControl: FormControl;

  // Objeto que guarda todos los datos del cliente
  client!: Clients;

  // Variables para gestionar administradores de empresas
  availableAdmins: Clients[] = [];                // Lista de posibles administradores

  constructor(
    private clientesServices: ClientsService,
    private clientsValidatorServices: ClientsValidatorService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {


    this.clientForm = this.fb.group({
      id: [null],
      type_client: ['', Validators.required],
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
      relationship_type: [undefined],
      parent_company_name: ['']
    });

    this.newAdminForm = this.fb.group({
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      identification: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      postal_code: ['', [Validators.required, Validators.maxLength(5)]],
      location: ['', Validators.required],
      province: ['', Validators.required],
      country: ['España', Validators.required]
    });

    this.selectedAdminControl = this.fb.control(null);
    this.adminTypeControl = this.fb.control('');

  }

  /**
   * Se ejecuta al cargar el componente
   * Busca el cliente que se quiere editar y carga datos relacionados
   */
  ngOnInit(): void {
    // Sacar el ID de la URL (ejemplo: /edit/123)
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        // Buscar los datos del cliente por su ID
        this.clientesServices.getClientById(id).subscribe({
          next: (data) => {
            if (data && data.length > 0) {
              this.client = data[0];

              // Cargar datos en el FormGroup
              this.clientForm.patchValue({
                id: this.client.id,
                type_client: this.client.type_client,
                name: this.client.name,
                lastname: this.client.lastname,
                company_name: this.client.company_name,
                identification: this.client.identification,
                phone: this.client.phone,
                email: this.client.email,
                address: this.client.address,
                postal_code: this.client.postal_code,
                location: this.client.location,
                province: this.client.province,
                country: this.client.country,
                date_create: this.client.date_create,
                date_update: this.client.date_update,
                parent_company_id: this.client.parent_company_id,
                relationship_type: this.client.relationship_type,
                parent_company_name: this.client.parent_company_name
              });
            }
            // Si es autónomo con empresa, cargar el nombre de la empresa
            if (this.client.type_client === 'autonomo' && this.client.parent_company_id) {
              this.loadCompanyName(this.client.parent_company_id);
            }
          },
          error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        })
      }
    });

    // Cargar lista de posibles administradores
    this.loadAvailableAdmins();
  }

  /**
   * Actualiza el cliente y maneja la lógica de administradores
   * Flujo principal que coordina todas las validaciones y actualizaciones
   */
  updateClient() {

    // Verificar que el formulario sea válido
    if (!this.clientForm.valid) {
      this.clientForm.markAllAsTouched();
      Swal.fire({
        title: 'Error!',
        text: 'Por favor, complete todos los campos requeridos',
        icon: 'error'
      });
      return;
    }
    const formValues = this.clientForm.value;

    // Verificar que el cliente tenga ID válido
    if (formValues.id === null || formValues.id === undefined) {
      Swal.fire({
        title: 'Error!',
        text: 'ID del Cliente no válido.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    // Crear objeto Clients desde el FormGroup
    const clientToUpdate: Clients = {
      id: formValues.id,
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
      date_create: formValues.date_create,
      date_update: formValues.date_update,
      parent_company_id: formValues.parent_company_id,
      relationship_type: formValues.relationship_type
    };

    // Limpiar espacios y preparar datos
    const cleanClient = this.clientsValidatorServices.cleanClientData(clientToUpdate);

    // Validar que todos los campos estén correctos
    const validation = this.clientsValidatorServices.validateClient(cleanClient);
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error de validación!',
        text: validation.message,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    // Actualizar la propiedad client para mantener compatibilidad
    this.client = clientToUpdate;

    // Lógica especial para empresas con administradores
    if (formValues.type_client === 'empresa') {
      if (this.adminTypeControl.value === 'new') {
        // Crear nuevo administrador primero, luego actualizar empresa
        this.createNewAdminAndUpdateCompany();
        return;
      } else if (this.adminTypeControl.value === 'existing' && this.selectedAdminControl.value) {
        // Asignar administrador existente, luego actualizar empresa
        this.assignExistingAdmin();
        return;
      }
    }

    // Flujo normal para otros tipos de cliente o empresas sin administrador
    this.performClientUpdate();
  }

  /**
   * Cancelar edición y regresar a la lista
   */
  goBack() {
    this.router.navigate(['/dashboards/clients/list']);
  }

  //================================================================================
  // INICIO

  /**
   * Carga lista de clientes que pueden ser administradores
   * Solo particulares y autónomos pueden ser administradores de empresas
   */
  private loadAvailableAdmins(): void {
    this.clientesServices.getClients().subscribe({
      next: (clients: Clients[]) => {
        this.availableAdmins = clients.filter(client =>
          client.type_client === 'particular' || client.type_client === 'autonomo'
        );
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  };

  /**
   * Carga el nombre de la empresa para autónomos
   * Muestra qué empresa está relacionada con el autónomo
   */
  private loadCompanyName(companyId: number): void {
    this.clientesServices.getClientById(companyId).subscribe({
      next: (company) => {
        // Si es empresa usar company_name, si no usar name
        const companyName = company[0]?.company_name || company[0]?.name;
        this.client.parent_company_name = companyName;

        // Actualizar también el FormGroup
        this.clientForm.patchValue({
          parent_company_name: companyName
        });

      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  /**
   * Asigna un administrador existente a la empresa
   * Actualiza los datos del administrador para vincularlo con la empresa
   */
  private assignExistingAdmin(): void {
    const selectedId = this.selectedAdminControl.value;
    if (!selectedId || !this.client.id) return;

    // Obtener los datos completos del administrador
    this.clientesServices.getClientById(selectedId).subscribe({
      next: (adminData) => {
        // Actualizar con todos sus datos + la nueva relación
        const updateData: Partial<Clients> = {
          ...adminData[0],
          parent_company_id: this.client.id,
          relationship_type: 'administrator'
        };
        this.clientesServices.updateClient(selectedId, updateData).subscribe({
          next: () => {
            this.performClientUpdate();
          },
          error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        });
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  /**
   * Crea un nuevo administrador y lo asigna a la empresa
   * Proceso: validar → crear administrador → vincular a empresa → actualizar cliente
   */
  private createNewAdminAndUpdateCompany(): void {
    // Verificar que el FormGroup del administrador sea válido
    if (!this.newAdminForm.valid) {
      this.newAdminForm.markAllAsTouched();
      Swal.fire({
        title: 'Error en datos del administrador',
        text: 'Por favor, complete todos los campos del administrador',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }
    // Obtener valores del FormGroup
    const adminFormValues = this.newAdminForm.value;

    // Crear objeto Clients desde el FormGroup
    const adminToCreate: Clients = {
      id: null,
      type_client: 'autonomo',
      name: adminFormValues.name,
      lastname: adminFormValues.lastname,
      company_name: '',
      identification: adminFormValues.identification,
      phone: adminFormValues.phone,
      email: adminFormValues.email,
      address: adminFormValues.address,
      postal_code: adminFormValues.postal_code,
      location: adminFormValues.location,
      province: adminFormValues.province,
      country: adminFormValues.country,
      date_create: '',
      date_update: '',
      parent_company_id: null,
      relationship_type: 'administrator'
    };


    // Validar datos del nuevo administrador
    const adminValidation = this.clientsValidatorServices.validateClient(adminToCreate);
    if (!adminValidation.isValid) {
      Swal.fire({
        title: 'Error en datos del administrador',
        text: adminValidation.message,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    // Limpiar y crear el nuevo administrador
    const cleanAdmin = this.clientsValidatorServices.cleanClientData(adminToCreate);
    this.clientesServices.createClientes(cleanAdmin).subscribe({
      next: (newAdmin) => {
        // Vincular el nuevo administrador con la empresa
        this.clientesServices.associateClientToCompany(this.client.id!, newAdmin[0].id!).subscribe({
          next: (adminActualizado) => {
            this.clientesServices.getClientById(newAdmin[0].id!).subscribe({
              next: (verificacion) => {
                this.performClientUpdate();
              }
            });
          },
          error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        });
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  /**
   * Actualiza solo los datos del cliente
   * Método separado de la lógica de administradores para mayor claridad
   */
  private performClientUpdate(): void {
    const cleanClient = this.clientsValidatorServices.cleanClientData(this.client);

    this.clientesServices.updateClient(this.client.id!, cleanClient).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.client = data[0];
          Swal.fire({
            title: '¡Éxito!',
            text: 'Cliente actualizado correctamente.',
            icon: 'success',
            confirmButtonText: 'Ok'
          });
          // Regresar a la lista de clientes
          this.router.navigate(['/dashboards/clients/list']);
        }
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  // FIN
  //==============================================================================

}
