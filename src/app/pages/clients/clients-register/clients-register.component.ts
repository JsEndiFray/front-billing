import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Clients, CompanyOption} from '../../../interface/clientes-interface';
import {ClientsService} from '../../../core/services/clients-services/clients.service';
import Swal from 'sweetalert2';
import {ClientsValidatorService} from '../../../core/services/validator-services/clients-validator.service';
import {HttpErrorResponse} from '@angular/common/http';
import {Router} from '@angular/router';

@Component({
  selector: 'app-clients',
  imports: [
    FormsModule
  ],
  templateUrl: './clients-register.component.html',
  styleUrl: './clients-register.component.css'
})
export class ClientsRegisterComponent implements OnInit {

  client: Clients = {
    id: 0,
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
    parent_company_id: undefined,
    relationship_type: undefined
  }

  // Lista de empresas
  companies: CompanyOption[] = [];

  constructor(
    private clientsService: ClientsService,
    private clientesValidatorServices: ClientsValidatorService,
    private router: Router,
  ) {
  }

  ngOnInit(): void {
    this.loadCompanies();
  }

  //Método para cargar empresas
  private loadCompanies() {
    this.clientsService.getCompanies().subscribe({
      next: (response) => {
        this.companies = response;
      },
      error: (e: HttpErrorResponse) => {
      }
    });
  }

  // Limpiar campos de relación cuando cambia el tipo
  onTypeClientChange() {
    if (this.client.type_client !== 'autonomo') {
      this.client.parent_company_id = undefined;
      this.client.relationship_type = undefined;
    }
  }


  createClient() {
    // 1. validacion
    const validation = this.clientesValidatorServices.validateClient(this.client);
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error!',
        text: validation.message,
        icon: 'error',
        confirmButtonText: 'Ok'
      })
      return;
    }
    // 2. LIMPIAR datos para enviar al backend
    const cleanClient = this.clientesValidatorServices.cleanClientData(this.client);

    //conexcion al backend
    this.clientsService.createClientes(cleanClient).subscribe({
      next: (data) => {
        Swal.fire({
          title: "Se ha registrado correctamente.",
          icon: "success",
          draggable: true
        });
        this.router.navigate(['dashboard/clients/list']);

      }, error: (e: HttpErrorResponse) => {
      }
    })
  }


}
