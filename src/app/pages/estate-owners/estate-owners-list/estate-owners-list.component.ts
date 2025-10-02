import {Component, OnInit} from '@angular/core';
import {EstatesOwners} from '../../../interfaces/estates-owners-interface';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import {EstateOwnersService} from '../../../core/services/estate-owners-services/estate-owners.service';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {SearchService} from '../../../core/services/shared-services/search.service';
import {PaginationConfig, PaginationResult} from '../../../interfaces/pagination-interface';
import {PaginationService} from '../../../core/services/shared-services/pagination.service';
import {ExportService} from '../../../core/services/shared-services/exportar.service';
import {ExportableListBase} from '../../../shared/Base/exportable-list.base';


/**
 * Componente para mostrar la lista de relaciones inmueble-propietario
 * Permite ver, editar y eliminar porcentajes de propiedad
 */
@Component({
  selector: 'app-estate-owners-list',
  imports: [
    DataFormatPipe,
    ReactiveFormsModule
  ],
  templateUrl: './estate-owners-list.component.html',
  styleUrl: './estate-owners-list.component.css'
})
export class EstateOwnersListComponent extends ExportableListBase<EstatesOwners> implements OnInit {

  // ==========================================
  // PROPIEDADES DE FORMULARIOS MÚLTIPLES
  // ==========================================
  // FormGroup para búsqueda de texto
  searchForm: FormGroup;

  // FormGroup para configuración de paginación
  paginationForm: FormGroup;

  // Lista de relaciones inmueble-propietario que se muestra en la tabla
  filteredEstateOwners: EstatesOwners[] = [];

// Lista completa de propietarios y propiedades (datos originales sin filtrar)
  allEstateOwners: EstatesOwners[] = [];

  estateOwners: EstatesOwners[] = [];

  // Configuración de paginación
  paginationConfig: PaginationConfig = {
    currentPage: 1,
    itemsPerPage: 5,
    totalItems: 0
  };

// Resultado de paginación
  paginationResult: PaginationResult<EstatesOwners> = {
    items: [],
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
    startIndex: 0,
    endIndex: 0
  };

  //===============================
  // FUNCIONES PARA LA EXPORTACION
  //===============================
  // Implementar propiedades abstractas
  entityName = 'porcentajes';//para nombrar los documentos descargados
  selectedItems: Set<number> = new Set();

  readonly exportColumns = [
    {key: 'id', title: 'ID', width: 10},
    {key: 'estate_name', title: 'Propiedad', width: 30},
    {key: 'owner_name', title: 'Propietario', width: 30},
    {
      key: 'ownership_percentage',
      title: 'Porcentaje (%)',
      width: 15,
      formatter: (value: unknown) => value ? `${value}%` : '-'
    }
  ];

  constructor(
    private estateOwnersService: EstateOwnersService,
    private router: Router,
    private searchService: SearchService,
    private paginationService: PaginationService,
    private fb: FormBuilder,
    public exportService: ExportService,
  ) {
    super();

    this.searchForm = this.fb.group({
      searchTerm: ['']
    });

    this.paginationForm = this.fb.group({
      itemsPerPage: [5]
    })
  };

  getFilteredData(): EstatesOwners[] {
    return this.filteredEstateOwners;
  }

  getCurrentPageData(): EstatesOwners[] {
    return this.estateOwners;
  }

  getPaginationConfig(): PaginationConfig {
    return this.paginationConfig;
  }


  /**
   * Se ejecuta al cargar el componente
   * Carga automáticamente la lista de relaciones
   */
  ngOnInit(): void {
    this.getAllEstateOwners();
    this.setupFormSubscriptions();
  }


// ==========================================
  // MÉTODOS DE CONFIGURACIÓN
  // ==========================================

  setupFormSubscriptions() {
    this.searchForm.get('searchTerm')?.valueChanges.subscribe(() => {
      this.applyFilters()
    })

    this.paginationForm.get('itemsPerPage')?.valueChanges.subscribe((items) => {
      this.paginationConfig.itemsPerPage = items;
      this.paginationConfig.currentPage = 1;
      this.updatePagination();
    });

  }

  // ==========================================
  // MÉTODOS DE CARGA DE DATOS
  // ==========================================

  /**
   * Obtiene todas las relaciones inmueble-propietario del servidor
   * Incluye nombres de inmuebles y propietarios para mostrar en la tabla
   */
  getAllEstateOwners() {
    this.estateOwnersService.getAllEstateOwners().subscribe({
      next: (data) => {
        this.allEstateOwners = data;
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
   * Limpia el filtro de búsqueda y muestra todo el porcentajes
   */
  clearFilters() {
    this.searchForm.patchValue({
      searchTerm: ''
    })
  }

  /**
   * Filtra la lista de empleados según el texto de búsqueda
   * Busca en: nombre completo, identificación y teléfono
   */
  applyFilters() {
    let filtered = [...this.allEstateOwners];

    // Obtener valores directamente de cada FormGroup independiente
    const searchTerm = this.searchForm.get('searchTerm')?.value;

    // Filtro por búsqueda de texto
    if (searchTerm) {
      filtered = this.searchService.filterData(
        filtered,
        searchTerm,
        ['owner_name', 'estate_name', 'ownership_percentage']
      )
    }


    this.filteredEstateOwners = filtered;
    this.paginationConfig.totalItems = filtered.length;
    this.paginationConfig.currentPage = 1;
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
      this.filteredEstateOwners,
      this.paginationConfig
    );
    this.estateOwners = this.paginationResult.items;
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
  };

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
      this.allEstateOwners.length
    );
  }

  // ==========================================
  // MÉTODOS DE NAVEGACIÓN Y CRUD
  // ==========================================

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
  };
}
