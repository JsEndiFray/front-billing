import {Component, OnInit} from '@angular/core';
import {Estates} from '../../../interface/estates.interface';
import {EstatesService} from '../../../core/services/estates-services/estates.service';
import {HttpErrorResponse} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import Swal from 'sweetalert2';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import {SearchService} from '../../../core/services/search-services/search.service';

/**
 * Componente para mostrar y gestionar la lista de propiedades inmobiliarias
 * Permite buscar, editar y eliminar inmuebles
 */
@Component({
  selector: 'app-estates-list',
  standalone: true,
  imports: [FormsModule, DataFormatPipe
  ],
  templateUrl: './estates-list.component.html',
  styleUrl: './estates-list.component.css'
})
export class EstatesListComponent implements OnInit {

  // Lista de propiedades que se muestra en la tabla
  estates: Estates[] = [];

  // Lista completa de propiedades (datos originales sin filtrar)
  allStates: Estates[] = [];

  // Texto que escribe el usuario para buscar
  searchTerm: string = '';

  constructor(
    private estateService: EstatesService,
    private router: Router,
    private searchService: SearchService,
  ) {
  }

  /**
   * Se ejecuta al cargar el componente
   * Carga la lista de propiedades automáticamente
   */
  ngOnInit(): void {
    this.getListEstate();
  }

  /**
   * Obtiene todas las propiedades del servidor
   * Guarda una copia original para los filtros de búsqueda
   */
  getListEstate() {
    this.estateService.getAllEstate().subscribe({
      next: (estates) => {
        this.estates = estates;        // Lista que se muestra
        this.allStates = estates;      // Copia original para filtros
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  /**
   * Filtra la lista de propiedades según el texto de búsqueda
   * Busca en: referencia catastral, dirección, localidad y provincia
   */
  filterEstates() {
    this.estates = this.searchService.filterData(
      this.allStates,
      this.searchTerm,
      ['cadastral_reference', 'address', 'location', 'province']
    );
  }

  /**
   * Limpia el filtro de búsqueda y muestra todas las propiedades
   */
  clearSearch() {
    this.searchTerm = '';
    this.filterEstates();
  };

  /**
   * Se ejecuta cada vez que el usuario escribe en el buscador
   */
  onSearchChange() {
    this.filterEstates();
  };

  /**
   * Navega a la página de edición de propiedad
   */
  editEstate(id: number) {
    this.router.navigate(['/dashboards/estates/edit', id]);
  }

  /**
   * Elimina una propiedad después de confirmar la acción
   * Muestra mensaje de confirmación antes de eliminar
   */
  deleteEstate(id: number) {
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
        this.estateService.deleteEstate(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado.',
              text: 'Inmueble eliminado correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
            // Recargar la lista para mostrar cambios
            this.getListEstate();
          },
          error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        })
      }
    })
  }

  newEstate(){
    this.router.navigate(['/dashboards/estates/register'])
  }
}
