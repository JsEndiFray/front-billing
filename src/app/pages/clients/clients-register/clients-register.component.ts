import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ClientsValidatorService} from '../../../core/services/validator-services/clients-validator.service';
import Swal from 'sweetalert2';
import {Clients} from '../../../interface/clientes-interface';
import {Router} from '@angular/router';
import {ClientsService} from '../../../core/services/clients-services/clients.service';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  providers: [
    ClientsValidatorService
  ],
  templateUrl: './clients-register.component.html',
  styleUrl: './clients-register.component.css'
})
export class ClientsRegisterComponent implements OnInit {
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
    country: 'ESPAÑA',
    date_create: '',
    date_update: '',
    parent_company_id: null,
    relationship_type: undefined
  };

  administrators: Clients[] = [];
  createdCompanyId: number | null | undefined = null;


  constructor(
    private clientsValidatorService: ClientsValidatorService,
    private router: Router,
    private clientsService: ClientsService
  ) {}

  ngOnInit(): void {
    // Generar CIF válido para pruebas
    console.log('CIF válido generado:', this.clientsValidatorService.generateValidCIF());
  }

  selectClientType(type: string): void {
    this.client.type_client = type;
    this.client.company_name = '';
    this.client.parent_company_id = null;
    this.client.relationship_type = undefined;

    // Limpiar administradores si cambia de empresa
    if (type !== 'empresa') {
      this.administrators = [];
    }

    if (type === 'autonomo') {
      this.client.relationship_type = 'administrator';
    }
  }

  updateCompanyName(): void {
    if (this.client.type_client === 'empresa') {
      this.client.company_name = `${this.client.name} ${this.client.lastname}`.trim();
    }
  }

  getIdentificationPlaceholder(): string {
    switch (this.client.type_client) {
      case 'empresa':
        return 'CIF (ej: A12345674)';
      case 'particular':
      case 'autonomo':
        return 'NIF, NIE o Pasaporte';
      default:
        return 'Identificación';
    }
  }

  // Gestión de administradores
  addAdministrator(): void {
    const newAdmin: Clients = {
      id: null,
      type_client: 'autonomo',
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
      country: 'ESPAÑA',
      date_create: '',
      date_update: '',
      parent_company_id: null,
      relationship_type: 'administrator'
    };
    this.administrators.push(newAdmin);
  }

  removeAdministrator(index: number): void {
    this.administrators.splice(index, 1);
  }

  validateAdministrator(admin: Clients): boolean {
    const validation = this.clientsValidatorService.validateClient(admin);
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error en administrador',
        text: validation.message,
        icon: 'error'
      });
      return false;
    }
    return true;
  }

  createClient(): void {
    if (!this.client.type_client) {
      Swal.fire({
        title: 'Error!',
        text: 'Debe seleccionar un tipo de cliente',
        icon: 'error'
      });
      return;
    }

    const cleanClient = this.clientsValidatorService.cleanClientData(this.client);
    const validation = this.clientsValidatorService.validateClient(cleanClient);

    if (!validation.isValid) {
      Swal.fire({
        title: 'Error!',
        text: validation.message,
        icon: 'error'
      });
      return;
    }

    this.clientsService.createClientes(cleanClient).subscribe({
      next: (data: Clients) => {
        this.createdCompanyId = data.id;

        // Si es empresa con administradores, crearlos
        if (this.client.type_client === 'empresa' && this.administrators.length > 0) {
          this.createAdministrators();
        } else {
          this.showSuccess();
        }
      },
      error: (e: HttpErrorResponse) => {}
    });
  }

  private createAdministrators(): void {
    // Validar todos los administradores primero
    for (let i = 0; i < this.administrators.length; i++) {
      if (!this.validateAdministrator(this.administrators[i])) {
        return;
      }
    }

    const adminPromises = this.administrators.map(admin => {
      const cleanAdmin = this.clientsValidatorService.cleanClientData(admin);
      cleanAdmin.parent_company_id = this.createdCompanyId;
      cleanAdmin.relationship_type = 'administrator';
      cleanAdmin.type_client = 'autonomo';

      return this.clientsService.createClientes(cleanAdmin).toPromise();
    });

    Promise.all(adminPromises).then(
      () => {
        Swal.fire({
          title: 'Éxito!',
          text: `Empresa y ${this.administrators.length} administrador(es) creados`,
          icon: 'success'
        });
        this.router.navigate(['/dashboard/clients/list']);
      }
    ).catch(
      () => {
        Swal.fire({
          title: 'Advertencia',
          text: 'Empresa creada pero error al crear algunos administradores',
          icon: 'warning'
        });
        this.router.navigate(['/dashboard/clients/list']);
      }
    );
  }

  private showSuccess(): void {
    Swal.fire({
      title: "Cliente registrado correctamente.",
      icon: "success",
      draggable: true
    });
    this.router.navigate(['/dashboard/clients/list']);
  }
}


