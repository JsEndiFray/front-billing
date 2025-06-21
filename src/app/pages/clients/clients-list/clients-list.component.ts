import {Component, OnInit} from '@angular/core';
import {Clients} from '../../../interface/clientes-interface';
import {ClientsService} from '../../../core/services/clients-services/clients.service';
import {HttpErrorResponse} from '@angular/common/http';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import Swal from 'sweetalert2';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {SearchService} from '../../../core/services/search-services/search.service';

/**
 * Componente para mostrar y gestionar la lista de clientes
 * Permite buscar, editar y eliminar clientes con diferentes tipos y relaciones
 */
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

  // Lista completa de clientes (datos originales sin filtrar)
  allClients: Clients[] = [];

  // Lista de clientes que se muestra en la tabla
  clients: Clients[] = [];

  // Texto que escribe el usuario para buscar
  searchTerm: string = '';

  constructor(
    private clientsService: ClientsService,
    private router: Router,
    private searchService: SearchService,
  ) {
  }

  /**
   * Se ejecuta al cargar el componente
   * Carga la lista de clientes automáticamente
   */
  ngOnInit(): void {
    this.getListClients();
  }

  /**
   * Obtiene todos los clientes del servidor
   * Guarda una copia original para los filtros de búsqueda
   */
  getListClients() {
    this.clientsService.getClients().subscribe({
      next: (client) => {
        this.clients = client;        // Lista que se muestra
        this.allClients = client;     // Copia original para filtros
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  }

  /**
   * Filtra la lista de clientes según el texto de búsqueda
   * Busca en: nombre completo, identificación, teléfono y nombre de empresa
   */
  filterClientes() {
    this.clients = this.searchService.filterWithFullName(
      this.allClients,
      this.searchTerm,
      'name',
      'lastname',
      ['identification', 'phone', 'company_name']
    );
  }

  /**
   * Limpia el filtro de búsqueda y muestra todos los clientes
   */
  clearSearch() {
    this.searchTerm = '';
    this.filterClientes();
  };

  /**
   * Se ejecuta cada vez que el usuario escribe en el buscador
   */
  onSearchChange() {
    this.filterClientes();
  };

  /**
   * Navega a la página de edición de cliente
   */
  editClient(id: number) {
    this.router.navigate(['/dashboard/clients/edit', id])
  }

  /**
   * Elimina un cliente después de confirmar la acción
   * Muestra mensaje de confirmación antes de eliminar
   */
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
        // Usuario confirmó, proceder a eliminar
        this.clientsService.deleleteUser(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado.',
              text: 'Cliente eliminado correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
            // Recargar la lista para mostrar cambios
            this.getListClients();
          }, error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        })
      }
    })
  }
  newClient(){
    this.router.navigate(['/dashboard/clients/register'])
  }

}
