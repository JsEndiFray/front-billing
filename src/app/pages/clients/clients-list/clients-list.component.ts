import {Component, OnInit} from '@angular/core';
import {Clients} from '../../../interface/clientes-interface';
import {ClientsService} from '../../../core/services/clients-services/clients.service';
import {HttpErrorResponse} from '@angular/common/http';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import Swal from 'sweetalert2';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {SearchService} from '../../../core/services/search-services/search.service';


@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [
    DataFormatPipe, FormsModule,

  ],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.css'
})
export class ClientsListComponent implements OnInit {

  // Lista completa de clientes (datos originales)
  allClients: Clients[] = [];

  // Datos que se muestran en la tabla (solo la página actual)
  clients: Clients[] = [];

  // Término de búsqueda
  searchTerm: string = '';


  constructor(
    private clientsService: ClientsService,
    private router: Router,
    private searchService: SearchService,
  ) {
  }

  ngOnInit(): void {
    this.getListClients();

  }

  //obtener el lislatado
  getListClients() {
    this.clientsService.getClients().subscribe({
      next: (client) => {
        this.clients = client;
        this.allClients = client;
      }, error: (e: HttpErrorResponse) => {
      }
    })
  }

  //método de flitros
  filterClientes() {
    this.clients = this.searchService.filterWithFullName(
      this.allClients,
      this.searchTerm,
      'name',
      'lastname',
      ['identification', 'phone', 'company_name']
    );
  }

  //Limpiar el término de búsqueda y mostrar todos los clientes
  clearSearch() {
    this.searchTerm = '';
    this.filterClientes();

  };

  onSearchChange() {
    this.filterClientes();
  };

//UPDATE
  editClient(id: number) {
    this.router.navigate(['/dashboard/clients/edit', id])
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
            this.getListClients();
          }, error: (e: HttpErrorResponse) => {
          }
        })
      }
    })
  }

}
