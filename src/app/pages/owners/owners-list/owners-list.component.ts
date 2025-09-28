import {Component, OnInit} from '@angular/core';
import {Owners} from '../../../interfaces/owners-interface';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {OwnersService} from '../../../core/services/owners-services/owners.service';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';
import {SearchService} from '../../../core/services/shared-services/search.service';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import {Router} from '@angular/router';
import {PaginationConfig, PaginationResult} from '../../../interfaces/pagination-interface';
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

  // ==========================================
  // PROPIEDADES DE FORMULARIOS MÚLTIPLES
  // ==========================================
  // FormGroup para búsqueda de texto
  searchForm: FormGroup;

  // FormGroup para filtros de selección
  filtersForm: FormGroup;

  // FormGroup para configuración de paginación
  paginationForm: FormGroup;

  // ==========================================
  // PROPIEDADES DE DATOS
  // ==========================================

  // Lista de propietarios que se muestra en la tabla
  owners: Owners[] = [];

  // Lista completa de propietarios (datos originales sin filtrar)
  allOwners: Owners[] = [];

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
    private fb: FormBuilder,
  ) {
    // FormGroup para búsqueda
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });

    this.filtersForm = this.fb.group({})

    this.paginationForm = this.fb.group({
      itemsPerPage: [5]
    })


  }

  /**
   * Se ejecuta al cargar el componente
   * Carga la lista de propietarios automáticamente
   */
  ngOnInit(): void {
    this.getListOwner();
    this.setupFormSubscriptions();
  }


  // ==========================================
  // MÉTODOS DE CONFIGURACIÓN
  // ==========================================

  setupFormSubscriptions() {
    this.searchForm.get('searchTerm')?.valueChanges.subscribe(() => {
      this.applyFilters();
    })

    // Suscripción para cambios en configuración de paginación
    this.paginationForm.get('itemsPerPage')?.valueChanges.subscribe((items) => {
      this.paginationConfig.itemsPerPage = items;
      this.paginationConfig.currentPage = 1; // Resetear a primera página
      this.updatePagination();
    });
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


  // ==========================================
  // MÉTODOS DE FILTROS Y BÚSQUEDA
  // ==========================================

  /**
   * Limpia el filtro de búsqueda
   */
  clearFilters() {
    this.searchForm.patchValue({
      searchTerm: ''
    })
  };

  /**
   * Filtra la lista de propietarios según el texto de búsqueda
   * Busca en: nombre completo, identificación y teléfono
   */
  applyFilters() {
    let filtered = [...this.allOwners];

    // Obtener valores directamente de cada FormGroup independiente
    const searchTerm = this.searchForm.get('searchTerm')?.value;

    // Filtro por búsqueda de texto
    if (searchTerm) {
      filtered = this.searchService.filterWithFullName(
        filtered,
        searchTerm,
        'name',
        'lastname',
        ['identification', 'phone']
      );
    }
    this.filteredOwners = filtered;
    this.paginationConfig.totalItems = filtered.length;
    this.paginationConfig.currentPage = 1; // Resetear a primera página
    this.updatePagination();
  };

  // ==========================================
  // MÉTODOS DE PAGINACIÓN
  // ==========================================

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

  // ==========================================
  // MÉTODOS DE NAVEGACIÓN Y CRUD
  // ==========================================

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

  exportData() {
  }
}
