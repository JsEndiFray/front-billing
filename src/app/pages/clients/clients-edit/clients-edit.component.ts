import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ClientsService} from '../../../core/services/clients-services/clients.service';
import {ClientsValidatorService} from '../../../core/services/validator-services/clients-validator.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Clients} from '../../../interface/clientes-interface';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-clients-edit',
  imports: [
    FormsModule
  ],
  templateUrl: './clients-edit.component.html',
  styleUrl: './clients-edit.component.css'
})
export class ClientsEditComponent implements OnInit {

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

  // Guardar la identificación original para validar cambios
  originalIdentification: string = '';

  // Propiedades para manejar administradores
  adminType: 'existing' | 'new' | '' = '';
  availableAdmins: Clients[] = [];
  selectedAdminId: number | null = null;

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

  //obtener ID y cargar datos
  ngOnInit(): void {
    // Obtener ID de la ruta
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        // Cargo los campos del cliente
        this.clientesServices.getClientById(id).subscribe({
          next: (client: Clients) => {
            this.client = client;
            // Guardar la identificación original para comparar
            this.originalIdentification = this.client.identification;

            // NUEVO: Cargar el nombre de la empresa si es autónomo con empresa
            if (this.client.type_client === 'autonomo' && this.client.parent_company_id) {
              this.loadCompanyName(this.client.parent_company_id);
            }
          },
          error: (e: HttpErrorResponse) => {
          }
        })
      }
    });

    this.loadAvailableAdmins();
  }

  // Cargar lista de clientes que pueden ser administradores
  private loadAvailableAdmins(): void {
    this.clientesServices.getClients().subscribe({
      next: (clients: Clients[]) => {
        this.availableAdmins = clients.filter(client =>
          client.type_client === 'particular' || client.type_client === 'autonomo'
        );
      },
      error: (e: HttpErrorResponse) => {
      }
    });
  };

  // Cargar nombre de la empresa para autónomos
  private loadCompanyName(companyId: number): void {
    this.clientesServices.getClientById(companyId).subscribe({
      next: (company: Clients) => {
        // Si es empresa, usar company_name, si no, usar name
        this.client.parent_company_name = company.company_name || company.name;
      },
      error: (e: HttpErrorResponse) => {
      }
    });
  }

// Asignar un administrador existente a la empresa
  private assignExistingAdmin(): void {
    if (!this.selectedAdminId || !this.client.id) return;
    // Primero obtenemos los datos completos del administrador
    this.clientesServices.getClientById(this.selectedAdminId).subscribe({
      next: (adminData: Clients) => {
        // Ahora actualizamos con todos sus datos + la nueva relación
        const updateData: Partial<Clients> = {
          ...adminData,  // Todos sus datos existentes
          parent_company_id: this.client.id,
          relationship_type: 'administrator'
        };
        this.clientesServices.updateClient(this.selectedAdminId!, updateData).subscribe({
          next: () => {
            this.performClientUpdate();
          },
          error: (e: HttpErrorResponse) => {
          }
        });
      },
      error: (e: HttpErrorResponse) => {
      }
    });
  }

// Crear un nuevo administrador y asignarlo a la empresa
  private createNewAdminAndUpdateCompany(): void {
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
    const cleanAdmin = this.clientsValidatorServices.cleanClientData(this.newAdmin);
    this.clientesServices.createClientes(cleanAdmin).subscribe({
      next: (newAdmin: Clients) => {
        this.clientesServices.associateClientToCompany(this.client.id!, newAdmin.id!).subscribe({
          next: (adminActualizado: Clients) => {
            this.clientesServices.getClientById(newAdmin.id!).subscribe({
              next: (verificacion: Clients) => {
                this.performClientUpdate();
              }
            });
          },
          error: (e: HttpErrorResponse) => {
          }
        });
      },
      error: (e: HttpErrorResponse) => {
      }
    });
  }

// Actualizar solo los datos del cliente (separado de la lógica de administradores)
  private performClientUpdate(): void {
    const cleanClient = this.clientsValidatorServices.cleanClientData(this.client);

    this.clientesServices.updateClient(this.client.id!, cleanClient).subscribe({
      next: (data: Clients) => {
        this.client = data;
        Swal.fire({
          title: '¡Éxito!',
          text: 'Cliente actualizado correctamente.',
          icon: 'success',
          confirmButtonText: 'Ok'
        });
        this.router.navigate(['/dashboard/clients/list']);
      },
      error: (e: HttpErrorResponse) => {
      }
    });
  }

//CONEXION A LA BAE DE DATOS
  updateClient() {
    //verificamos la ID
    if (this.client.id === null || this.client.id === undefined) {
      Swal.fire({
        title: 'Error!',
        text: 'ID del Cliente no válido.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    //Limpiar y transformar datos
    const cleanClient = this.clientsValidatorServices.cleanClientData(this.client);

    // Validar campos requeridos
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
     //acceso al backend
    //Si es una empresa y se va a asignar un administrador
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

  // Volver a la página anterior
  goBack() {
    this.router.navigate(['/dashboard/clients/list']);
  }
}
