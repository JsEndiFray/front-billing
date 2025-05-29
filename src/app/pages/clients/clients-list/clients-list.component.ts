import {Component, OnInit} from '@angular/core';
import {Clients} from '../../../interface/clientes-interface';
import {ClientsService} from '../../../core/services/clients-services/clients.service';
import {HttpErrorResponse} from '@angular/common/http';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-clients-list',
  standalone: true,
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

  loadClients(): void {
    this.clientsService.getClients().subscribe({
      next: (response) => {
        this.clients = response.data;
      }, error: (e: HttpErrorResponse) => {
      }
    })
  }

//UPDATE
  editClient(id: number) {


  }

//DELETE
  deleteClient(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.clientsService.deleleteUser(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado.',
              text: 'Cliente eliminado correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
            this.loadClients();

          }, error: (e: HttpErrorResponse) => {
          }
        })
      }

    })
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
