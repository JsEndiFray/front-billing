import {Component, OnInit} from '@angular/core';
import {Owners} from '../../../interface/owners-interface';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {OwnersService} from '../../../core/services/owners-services/owners.service';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';
import {SearchService} from '../../../core/services/shared-services/search.service';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import {Router} from '@angular/router';
import {PaginationConfig, PaginationResult} from '../../../interface/pagination';
import {PaginationService} from '../../../core/services/shared-services/pagination.service';

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

  // Lista de clientes filtrados (antes de paginar)
  filteredOwners: Owners[] = [];

  // Configuración de paginación
  paginationConfig: PaginationConfig = {
    currentPage: 1,
    itemsPerPage: 3,
    totalItems: 0
  };

  // Resultado de paginación
  paginationResult: PaginationResult<Owners> = {
    items: [],
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
    startIndex: 0,
    endIndex: 0
  };

  constructor(
    private ownersService: OwnersService,
    private searchService: SearchService,
    private router: Router,
    private paginationService: PaginationService,
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
      next: (ownersList) => {
        this.allOwners = ownersList;
        this.applyFilters();
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  }

  /**
   * Filtra la lista de propietarios según el texto de búsqueda
   * Busca en: nombre completo, identificación y teléfono
   */
  applyFilters() {
    let filtered = [...this.allOwners];
    // Filtro por búsqueda de texto
    if (this.searchTerm.trim()) {
      filtered = this.searchService.filterWithFullName(
        filtered,
        this.searchTerm,
        'name',
        'lastname',
        ['identification', 'phone']
      );
    }
    this.filteredOwners = filtered;
    this.paginationConfig.totalItems = filtered.length;
    this.paginationConfig.currentPage = 1;

    this.updatePagination();
  }

  /**
   * Actualiza la paginación con los datos filtrados
   */
  updatePagination() {
    this.paginationResult = this.paginationService.paginate(
      this.filteredOwners,
      this.paginationConfig
    );
    this.owners = this.paginationResult.items;
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters() {
    this.searchTerm = '';
    this.applyFilters();
  }
  /**
   * Navega a una página específica
   */
  goToPage(page: number) {
    if (this.paginationService.isValidPage(page, this.paginationResult.totalPages)) {
      this.paginationConfig.currentPage = page;
      this.updatePagination();
    }
  }

  /**
   * Navega a la página anterior
   */
  previousPage() {
    if (this.paginationResult.hasPrevious) {
      this.goToPage(this.paginationConfig.currentPage - 1);
    }
  };

  /**
   * Navega a la página siguiente
   */
  nextPage() {
    if (this.paginationResult.hasNext) {
      this.goToPage(this.paginationConfig.currentPage + 1);
    }
  }

  /**
   * Obtiene las páginas visibles para la navegación
   */
  getVisiblePages(): number[] {
    return this.paginationService.getVisiblePages(
      this.paginationConfig.currentPage,
      this.paginationResult.totalPages,
      5
    );
  }

  /**
   * Obtiene el texto informativo de paginación
   */
  getPaginationText(): string {
    return this.paginationService.getPaginationText(
      this.paginationConfig,
      this.owners.length
    );
  }

  /**
   * Se ejecuta cada vez que el usuario escribe en el buscador
   */
  onSearchChange() {
    this.applyFilters();
  }

  /**a
   * Navega a la página de edición de propietario
   */
  editOwner(id: number) {
    this.router.navigate(['/dashboards/owners/edit', id]);
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

  newOwners() {
    this.router.navigate(['/dashboards/owners/register'])
  }
}
