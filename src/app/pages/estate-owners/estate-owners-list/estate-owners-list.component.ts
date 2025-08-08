import {Component, OnInit} from '@angular/core';
import {EstatesOwners} from '../../../interface/estates-owners-interface';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import {EstateOwnersService} from '../../../core/services/estate-owners-services/estate-owners.service';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';
import {FormsModule} from '@angular/forms';
import {SearchService} from '../../../core/services/shared-services/search.service';

/**
 * Componente para mostrar la lista de relaciones inmueble-propietario
 * Permite ver, editar y eliminar porcentajes de propiedad
 */
@Component({
  selector: 'app-estate-owners-list',
  imports: [
    DataFormatPipe,
    FormsModule
  ],
  templateUrl: './estate-owners-list.component.html',
  styleUrl: './estate-owners-list.component.css'
})
export class EstateOwnersListComponent implements OnInit {

  // Lista de relaciones inmueble-propietario que se muestra en la tabla
  estateOwners: EstatesOwners[] = [];

// Lista completa de propietarios y propiedades (datos originales sin filtrar)
  allEstateOwners: EstatesOwners[] = [];

// Texto que escribe el usuario para buscar
  searchTerm: string = '';

  constructor(
    private estateOwnersService: EstateOwnersService,
    private router: Router,
    private searchService: SearchService,
  ) {
  }

  /**
   * Se ejecuta al cargar el componente
   * Carga automáticamente la lista de relaciones
   */
  ngOnInit(): void {
    this.getAllEstateOwners();
  }

  /**
   * Obtiene todas las relaciones inmueble-propietario del servidor
   * Incluye nombres de inmuebles y propietarios para mostrar en la tabla
   */
  getAllEstateOwners() {
    this.estateOwnersService.getAllEstateOwners().subscribe({
      next: (data) => {
        this.estateOwners = data;
        this.allEstateOwners = data;
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  }



  /**
   * Filtra la lista de porcentajes según el texto de búsqueda
   * Busca en: propietario y direccion, identificación y teléfono
   */
  filterOwners() {
    this.estateOwners = this.searchService.filterData(
      this.allEstateOwners,
      this.searchTerm,
      ['owner_name', 'estate_name', 'ownership_percentage']
    )
  }

  /**
   * Limpia el filtro de búsqueda y muestra todo el porcentajes
   */
  clearFilters() {
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
   * Navega a la página de edición de la relación
   */
  editEstateOwners(id: number) {
    this.router.navigate(['/dashboards/estates-owners/edit', id])
  }

  /**
   * Elimina una relación inmueble-propietario después de confirmar
   * Muestra mensaje de confirmación antes de eliminar
   */
  deleteEstateOwners(id: number) {
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
        this.estateOwnersService.deleteEstateOwners(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado.',
              text: 'El porcentage de la propriedad fue eliminado correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
            // Recargar la lista para mostrar cambios
            this.getAllEstateOwners();

          }, error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        })
      }
    })
  }

  newEstateOwner() {
    this.router.navigate(['/dashboards/estates/register'])
  }
}
