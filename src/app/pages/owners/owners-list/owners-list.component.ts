import {Component, OnInit} from '@angular/core';
import {Owners} from '../../../interface/owners-interface';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {OwnersService} from '../../../core/services/owners-services/owners.service';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';
import {SearchService} from '../../../core/services/search-services/search.service';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import {Router} from '@angular/router';

/**
 * Componente para mostrar y gestionar la lista de propietarios
 * Permite buscar, editar y eliminar propietarios con datos completos
 */
@Component({
  selector: 'app-owners-list',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    DataFormatPipe
  ],
  templateUrl: './owners-list.component.html',
  styleUrl: './owners-list.component.css'
})
export class OwnersListComponent implements OnInit {

  // Lista de propietarios que se muestra en la tabla
  owners: Owners[] = [];

  // Lista completa de propietarios (datos originales sin filtrar)
  allOwners: Owners[] = [];

  // Texto que escribe el usuario para buscar
  searchTerm: string = '';

  constructor(
    private ownersService: OwnersService,
    private searchService: SearchService,
    private router: Router,
  ) {
  }

  /**
   * Se ejecuta al cargar el componente
   * Carga la lista de propietarios automáticamente
   */
  ngOnInit(): void {
    this.getListOwner();
  }

  /**
   * Obtiene todos los propietarios del servidor
   * Guarda una copia original para los filtros de búsqueda
   */
  getListOwner() {
    this.ownersService.getOwners().subscribe({
      next: (data) => {
        this.owners = data;        // Lista que se muestra
        this.allOwners = data;     // Copia original para filtros
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  }

  /**
   * Filtra la lista de propietarios según el texto de búsqueda
   * Busca en: nombre completo, identificación y teléfono
   */
  filterOwners() {
    this.owners = this.searchService.filterWithFullName(
      this.allOwners,
      this.searchTerm,
      'name',
      'lastname',
      ['identification', 'phone']
    );
  }

  /**
   * Limpia el filtro de búsqueda y muestra todos los propietarios
   */
  clearSearch() {
    this.searchTerm = '';
    this.filterOwners();
  }

  /**
   * Se ejecuta cada vez que el usuario escribe en el buscador
   */
  onSearchChange() {
    this.filterOwners();
  }

  /**
   * Navega a la página de edición de propietario
   */
  editOwner(id: number) {
    this.router.navigate(['/dashboard/owners/edit', id]);
  }

  /**
   * Elimina un propietario después de confirmar la acción
   * Muestra mensaje de confirmación antes de eliminar
   */
  deleteOwner(id: number) {
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
        this.ownersService.deleteOwner(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado.',
              text: 'Propietario eliminado correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
            // Recargar la lista para mostrar cambios
            this.getListOwner();
          }, error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        })
      }
    })
  }

  newOwners(){
    this.router.navigate(['/dashboard/owners/register'])
  }
}
