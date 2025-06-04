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
          }, error: (e: HttpErrorResponse) => {
          }
        })
      }
    })

  }


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
    this.clientesServices.updateClient(this.client.id, cleanClient).subscribe({
      next: (data) => {
        this.client = data;
        Swal.fire({
          title: '¡Éxito!',
          text: 'Cliente actualizado correctamente.',
          icon: 'success',
          confirmButtonText: 'Ok'
        });
        // Navegar de vuelta a la lista
        this.router.navigate(['/dashboard/clients/list']);
      }, error: (e: HttpErrorResponse) => {
      }
    })

  }
  // Volver a la página anterior
  goBack() {
    this.router.navigate(['/dashboard/clients/list']);
  }
}
