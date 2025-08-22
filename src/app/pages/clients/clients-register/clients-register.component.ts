import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ClientsValidatorService} from '../../../core/services/validator-services/clients-validator.service';
import Swal from 'sweetalert2';
import {Clients} from '../../../interfaces/clientes-interface';
import {Router} from '@angular/router';
import {ClientsService} from '../../../core/services/clients-services/clients.service';
import {HttpErrorResponse} from '@angular/common/http';

/**
 * Componente para registrar nuevos clientes con tipos dinámicos
 * Maneja particulares, autónomos y empresas con administradores múltiples
 */
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

  // Objeto que guarda los datos del cliente principal
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

  // Lista de administradores para empresas (solo si es empresa)
  administrators: Clients[] = [];

  // ID de la empresa creada (para vincular administradores)
  createdCompanyId: number | null | undefined = null;

  constructor(
    private clientsValidatorService: ClientsValidatorService,
    private router: Router,
    private clientsService: ClientsService
  ) {
  }

  /**
   * Se ejecuta al cargar el componente
   * Genera un CIF válido para pruebas de desarrollo
   */
  ngOnInit(): void {
    // Generar CIF válido para pruebas
    console.log('CIF válido generado:', this.clientsValidatorService.generateValidCIF());
  }

  /**
   * Selecciona el tipo de cliente y ajusta los campos
   * Limpia datos específicos según el tipo seleccionado
   */
  selectClientType(type: string): void {
    this.client.type_client = type;
    this.client.company_name = '';
    this.client.parent_company_id = null;
    this.client.relationship_type = undefined;

    // Limpiar administradores si cambia de empresa
    if (type !== 'empresa') {
      this.administrators = [];
    }

    // Los autónomos pueden ser administradores por defecto
    if (type === 'autonomo') {
      this.client.relationship_type = 'administrator';
    }
  }

  /**
   * Actualiza automáticamente el nombre de la empresa
   * Se ejecuta cuando cambian nombre o apellidos en empresas
   */
  updateCompanyName(): void {
    if (this.client.type_client === 'empresa') {
      this.client.company_name = `${this.client.name} ${this.client.lastname}`.trim();
    }
  }

  /**
   * Devuelve el placeholder apropiado según el tipo de cliente
   * CIF para empresas, NIF/NIE para particulares y autónomos
   */
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

  /**
   * Añade un nuevo administrador a la lista
   * Solo disponible para empresas
   */
  addAdministrator(): void {
    const newAdmin: Clients = {
      id: null,
      type_client: 'autonomo',        // Los administradores siempre son autónomos
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
      parent_company_id: null,         // Se asignará después de crear la empresa
      relationship_type: 'administrator'
    };
    this.administrators.push(newAdmin);
  }

  /**
   * Elimina un administrador de la lista
   */
  removeAdministrator(index: number): void {
    this.administrators.splice(index, 1);
  }

  /**
   * Valida los datos de un administrador
   * Muestra mensaje de error si la validación falla
   */
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

  /**
   * Crea el cliente principal y maneja la lógica de administradores
   * Flujo: validar cliente → crear cliente → crear administradores (si aplica)
   */
  createClient(): void {
    // Verificar que se haya seleccionado un tipo
    if (!this.client.type_client) {
      Swal.fire({
        title: 'Error!',
        text: 'Debe seleccionar un tipo de cliente',
        icon: 'error'
      });
      return;
    }

    // Limpiar espacios y validar datos del cliente principal
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

    // Crear el cliente principal
    this.clientsService.createClientes(cleanClient).subscribe({
      next: (data) => {
        this.createdCompanyId = data[0].id;

        // Si es empresa con administradores, crearlos después
        if (this.client.type_client === 'empresa' && this.administrators.length > 0) {
          this.createAdministrators();
        } else {
          // Si no hay administradores, mostrar éxito directamente
          this.showSuccess();
        }
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  /**
   * Crea todos los administradores de la empresa
   * Proceso: validar todos → crear en paralelo → mostrar resultado
   */
  private createAdministrators(): void {
    // Validar todos los administradores antes de crear ninguno
    for (let i = 0; i < this.administrators.length; i++) {
      if (!this.validateAdministrator(this.administrators[i])) {
        return; // Si alguno falla, no crear ninguno
      }
    }

    // Crear todas las promesas para crear administradores en paralelo
    const adminPromises = this.administrators.map(admin => {
      const cleanAdmin = this.clientsValidatorService.cleanClientData(admin);
      cleanAdmin.parent_company_id = this.createdCompanyId;  // Vincular con la empresa
      cleanAdmin.relationship_type = 'administrator';
      cleanAdmin.type_client = 'autonomo';

      return this.clientsService.createClientes(cleanAdmin).toPromise();
    });

    // Ejecutar todas las creaciones en paralelo
    Promise.all(adminPromises).then(
      (results: (Clients[] | undefined)[]) => {
        // Todos los administradores creados correctamente
        Swal.fire({
          title: 'Éxito!',
          text: `Empresa y ${this.administrators.length} administrador(es) creados`,
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

  /**
   * Muestra mensaje de éxito y redirige a la lista
   * Para clientes sin administradores
   */
  private showSuccess(): void {
    Swal.fire({
      title: "Cliente registrado correctamente.",
      icon: "success",
      draggable: true
    });
    this.router.navigate(['/dashboards/clients/list']);
  }

  goBack() {
    this.router.navigate(['/dashboards/clients/list'])
  }
}
