import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ClientsService} from '../../../core/services/clients-services/clients.service';
import {ClientsValidatorService} from '../../../core/services/validator-services/clients-validator.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Clients} from '../../../interface/clientes-interface';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';

/**
 * Componente para editar clientes existentes
 * Maneja diferentes tipos de clientes y gestión de administradores para empresas
 */
@Component({
  selector: 'app-clients-edit',
  imports: [
    FormsModule
  ],
  templateUrl: './clients-edit.component.html',
  styleUrl: './clients-edit.component.css'
})
export class ClientsEditComponent implements OnInit {

  // Objeto que guarda todos los datos del cliente
  client: Clients = {
    id: null,
    type_client: '',
    name: '',
    lastname: '',
    company_name: '',
    identification: '',
    phone: '',
    email: '',
    address: '',
    postal_code: '',
    location: '',
    province: '',
    country: '',
    date_create: '',
    date_update: '',
    parent_company_id: null,
    relationship_type: 'administrator',
    parent_company_name: ''
  }

  // Variables para gestionar administradores de empresas
  adminType: 'existing' | 'new' | '' = '';        // Tipo de asignación de administrador
  availableAdmins: Clients[] = [];                // Lista de posibles administradores
  selectedAdminId: number | null = null;          // ID del administrador seleccionado

  // Datos para crear un nuevo administrador
  newAdmin: Clients = {
    id: null,
    type_client: 'autonomo',
    name: '',
    lastname: '',
    identification: '',
    email: '',
    phone: '',
    address: '',
    postal_code: '',
    location: '',
    province: '',
    country: 'España'
  };

  constructor(
    private clientesServices: ClientsService,
    private clientsValidatorServices: ClientsValidatorService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
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
        this.client.parent_company_name = company[0]?.company_name || company[0]?.name;
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
    if (!this.selectedAdminId || !this.client.id) return;

    // Obtener los datos completos del administrador
    this.clientesServices.getClientById(this.selectedAdminId).subscribe({
      next: (adminData) => {
        // Actualizar con todos sus datos + la nueva relación
        const updateData: Partial<Clients> = {
          ...adminData[0],  // Conservar todos sus datos existentes
          parent_company_id: this.client.id,
          relationship_type: 'administrator'
        };
        this.clientesServices.updateClient(this.selectedAdminId!, updateData).subscribe({
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
    // Validar datos del nuevo administrador
    const adminValidation = this.clientsValidatorServices.validateClient(this.newAdmin);
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
    const cleanAdmin = this.clientsValidatorServices.cleanClientData(this.newAdmin);
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
          this.router.navigate(['/dashboard/clients/list']);
        }
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  /**
   * Actualiza el cliente y maneja la lógica de administradores
   * Flujo principal que coordina todas las validaciones y actualizaciones
   */
  updateClient() {
    // Verificar que el cliente tenga ID válido
    if (this.client.id === null || this.client.id === undefined) {
      Swal.fire({
        title: 'Error!',
        text: 'ID del Cliente no válido.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    // Limpiar espacios y preparar datos
    const cleanClient = this.clientsValidatorServices.cleanClientData(this.client);

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

    // Lógica especial para empresas con administradores
    if (this.client.type_client === 'empresa') {
      if (this.adminType === 'new') {
        // Crear nuevo administrador primero, luego actualizar empresa
        this.createNewAdminAndUpdateCompany();
        return;
      } else if (this.adminType === 'existing' && this.selectedAdminId) {
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
    this.router.navigate(['/dashboard/clients/list']);
  }
}
