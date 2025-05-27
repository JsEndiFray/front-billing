import {Component, OnInit} from '@angular/core';
import {Clients} from '../../../interface/clientes-interface';
import {ClientsService} from '../../../core/services/clients-services/clients.service';
import {HttpErrorResponse} from '@angular/common/http';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';


@Component({
  selector: 'app-clients-list',
  imports: [
    DataFormatPipe,
  ],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.css'
})
export class ClientsListComponent implements OnInit {


  // Datos que se muestran en la tabla (solo la página actual)
  clients: Clients[] = [];



  constructor(private clientsService: ClientsService) {
  }

  ngOnInit(): void {
    this.getListClients();
  }


//UPDATE
  editClient(id: number) {

  }

//DELETE
  deleteClient(id: number) {
  }

  //conexión DB
  getListClients() {
    this.clientsService.getClients().subscribe({
      next: (response) => {
        this.clients = response.data;

    }, error: (e: HttpErrorResponse) => {
      }
    })
  }


}
