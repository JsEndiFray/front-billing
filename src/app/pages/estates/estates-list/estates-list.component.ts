import {Component, OnInit} from '@angular/core';
import {Estates} from '../../../interfaces/estates-interface';
import {EstatesService} from '../../../core/services/entity-services/estates.service';
import {HttpErrorResponse} from '@angular/common/http';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import Swal from 'sweetalert2';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import {SearchService} from '../../../core/services/shared-services/search.service';
import {PaginationConfig, PaginationResult} from '../../../interfaces/pagination-interface';
import {PaginationService} from '../../../core/services/shared-services/pagination.service';
import {ExportService} from '../../../core/services/shared-services/exportar.service';
import {ExportableListBase} from '../../../shared/Base/exportable-list.base';

/**
 * Componente para mostrar y gestionar la lista de propiedades inmobiliarias
 * Permite buscar, editar y eliminar inmuebles
 */
@Component({
  selector: 'app-estates-list',
  standalone: true,
  imports: [
    DataFormatPipe,
    ReactiveFormsModule
  ],
  templateUrl: './estates-list.component.html',
  styleUrl: './estates-list.component.css'
})
export class EstatesListComponent extends ExportableListBase<Estates> implements OnInit {

  // ==========================================
  // PROPIEDADES DE FORMULARIOS MÚLTIPLES
  // ==========================================

  searchForm: FormGroup;

  filtersForm: FormGroup;

  paginationForm: FormGroup;

  // ==========================================
  // PROPIEDADES DE DATOS
  // ==========================================

  // Lista de propiedades que se muestra en la tabla
  estates: Estates[] = [];

  // Lista completa de propiedades (datos originales sin filtrar)
  allStates: Estates[] = [];

  // Lista de clientes filtrados (antes de paginar)
  filteredEstates: Estates[] = [];

  // Opciones para filtros
  provinceOptions: string[] = [];

  // Configuración de paginación
  paginationConfig: PaginationConfig = {
    currentPage: 1,
    itemsPerPage: 5,
    totalItems: 0
  };

// Resultado de paginación
  paginationResult: PaginationResult<Estates> = {
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
  entityName = 'propiedades'; //para nombrar los documentos descargados
  selectedItems: Set<number> = new Set();


  readonly exportColumns = [
    {key: 'id', title: 'ID', width: 10},
    {key: 'cadastral_reference', title: 'Ref. Catastral', width: 20},
    {key: 'price', title: 'Precio (€)', width: 15, formatter: (value: unknown) => value ? `${value} €` : '-'},
    {key: 'address', title: 'Dirección', width: 30},
    {key: 'postal_code', title: 'C.P.', width: 10},
    {key: 'location', title: 'Localidad', width: 20},
    {key: 'province', title: 'Provincia', width: 20},
    {key: 'country', title: 'País', width: 15},
    {key: 'surface', title: 'Superficie (m²)', width: 15, formatter: (value: unknown) => value ? `${value} m²` : '-'}
  ];

  constructor(
    private estateService: EstatesService,
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

    this.filtersForm = this.fb.group({
      selectedProvince: ['']
    });

    this.paginationForm = this.fb.group({
      itemsPerPage: [5]
    });
  };

  // Implementar métodos abstractos
  getFilteredData(): Estates[] {
    return this.filteredEstates;
  }

  getCurrentPageData(): Estates[] {
    return this.estates;
  }

  getPaginationConfig(): PaginationConfig {
    return this.paginationConfig;
  }

  /**
   * Se ejecuta al cargar el componente
   * Carga la lista de propiedades automáticamente
   */
  ngOnInit(): void {
    this.getListEstate();
    this.setupFormSubscriptions();
  }

  // ==========================================
  // MÉTODOS DE CONFIGURACIÓN
  // ==========================================


  setupFormSubscriptions() {
    this.searchForm.get('searchTerm')?.valueChanges.subscribe(() => {
      this.applyFilters()
    });

    this.filtersForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    // Suscripción para cambios en configuración de paginación
    this.paginationForm.get('itemsPerPage')?.valueChanges.subscribe((items) => {
      this.paginationConfig.itemsPerPage = items;
      this.paginationConfig.currentPage = 1; // Resetear a primera página
      this.updatePagination();
    });
  }

  // ==========================================
  //EXTRAER  DATOS
  // ==========================================

  /**
   * Obtiene todas las propiedades del servidor
   * Guarda una copia original para los filtros de búsqueda
   */
  getListEstate() {
    this.estateService.getAllEstate().subscribe({
      next: (estatesList) => {
        this.allStates = estatesList;
        this.extractProvinceOptions();
        this.applyFilters();
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  // ==========================================
  // METODOS DE FILTROS
  // ==========================================

  /**
   * Extrae las provincias únicas de los clientes para el filtro
   */
  extractProvinceOptions() {
    // Toma todos los clientes y extrae solo las provincias
    const provinces = this.allStates
      .map(estates => estates.province)
      // Elimina duplicados y valores vacíos
      .filter((province, index, array) => province && array.indexOf(province) === index)
      // Ordena alfabéticamente
      .sort();
    this.provinceOptions = provinces;
  }

  /**
   * Filtra la lista de propiedades según el texto de búsqueda
   * Busca en: referencia catastral, dirección, localidad y provincia
   */
  applyFilters() {
    let filtered = [...this.allStates];

    const searchTerm = this.searchForm.get('searchTerm')?.value;
    const selectedProvince = this.filtersForm.get('selectedProvince')?.value;

    // Filtro por búsqueda de texto
    if (searchTerm) {
      filtered = this.searchService.filterData(
        filtered,
        searchTerm,
        ['cadastral_reference', 'address', 'location', 'province']
      );
    }
    // Filtro por provincia
    if (selectedProvince) {
      filtered = filtered.filter(estate => estate.province === selectedProvince);
    }
    this.filteredEstates = filtered;
    this.paginationConfig.totalItems = filtered.length;
    this.paginationConfig.currentPage = 1; // Resetear a primera página
    this.updatePagination();
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters() {
    this.searchForm.patchValue({
      searchTerm: ''
    });

    this.filtersForm.patchValue({
      selectedProvince: ''
    })

  }

  // ==========================================
  // METODO DE PAGINACION
  // ==========================================

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
   * Actualiza la paginación con los datos filtrados
   */
  updatePagination() {
    this.paginationResult = this.paginationService.paginate(
      this.filteredEstates,
      this.paginationConfig
    );
    this.estates = this.paginationResult.items;
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
      this.estates.length
    );
  };

  // ==========================================
  // METODO CRD
  // ==========================================

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

  newEstate() {
    this.router.navigate(['/dashboards/estates/register'])
  };
}
