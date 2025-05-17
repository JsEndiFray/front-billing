import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Clients} from '../../../interface/clientes-interface';

@Component({
  selector: 'app-clients',
  imports: [
    FormsModule
  ],
  templateUrl: './clients-register.component.html',
  styleUrl: './clients-register.component.css'
})
export class ClientsRegisterComponent {

  clients: Clients = {
    id: 0,
    type_client: '',
    name: '',
    lastname: '',
    company_name: '',
    identification: '',
    address: '',
    postal_code: '',
    location: '',
    province: '',
    country: ''
  }


}
