import {Component} from '@angular/core';
import {Clients} from '../../../interface/clientes-interface';

@Component({
  selector: 'app-clients-list',
  imports: [],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.css'
})
export class ClientsListComponent {
  constructor() {
  }



  clients: Clients[] = []

  editClient(id: number) {

  }

  deleteClient(id: number) {
  }

  //conexión DB


}
