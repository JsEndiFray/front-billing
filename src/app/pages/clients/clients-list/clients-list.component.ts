import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Clients} from '../../../interfaces/clientes-interface';
import {ClientsService} from '../../../core/services/clients-services/clients.service';
import {HttpErrorResponse} from '@angular/common/http';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import Swal from 'sweetalert2';
import {Router} from '@angular/router';
import {SearchService} from '../../../core/services/shared-services/search.service';
import {PaginationConfig, PaginationResult} from '../../../interfaces/pagination-interface';
import {PaginationService} from '../../../core/services/shared-services/pagination.service';
import {CLIENT_TYPES_LABELS} from '../../../shared/Collection-Enum/collection-enum';
import {ExportService} from '../../../core/services/shared-services/exportar.service';
import {ExportableListBase} from '../../../shared/Base/exportable-list.base';

/**
 * Componente para mostrar y gestionar la lista de clientes
 * Refactorizado con FormGroups múltiples e independientes
 */
@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [
    DataFormatPipe,
    ReactiveFormsModule,

  ],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.css'
})
export class ClientsListComponent extends ExportableListBase<Clients> implements OnInit {

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

  // Lista de clientes que se muestra en la tabla
  clients: Clients[] = [];

  // Lista completa de clientes (datos originales sin filtrar)
  allClients: Clients[] = [];

  // Lista de clientes filtrados (antes de paginar)
  filteredClients: Clients[] = [];

  // Opciones para filtros
  provinceOptions: string[] = [];

  // LABEL PARA MOSTRAR
  clientTypeLabels = CLIENT_TYPES_LABELS;

  // Configuración de paginación
  paginationConfig: PaginationConfig = {
    currentPage: 1,
    itemsPerPage: 5,
    totalItems: 0
  };

  // Resultado de paginación
  paginationResult: PaginationResult<Clients> = {
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
  entityName = 'clientes';//para nombrar los documentos descargados
  selectedItems: Set<number> = new Set();

  readonly exportColumns = [
    {key: 'id', title: 'ID', width: 10},
    {key: 'type_client', title: 'Tipo', width: 15},
    {key: 'name', title: 'Nombre', width: 20},
    {key: 'lastname', title: 'Apellidos', width: 20},
    {key: 'company_name', title: 'Empresa', width: 25},
    {key: 'identification', title: 'Identificación', width: 15},
    {key: 'email', title: 'Email', width: 25},
    {key: 'phone', title: 'Teléfono', width: 15},
    {key: 'location', title: 'Localidad', width: 20},
    {key: 'province', title: 'Provincia', width: 20}
  ];


  constructor(
    private fb: FormBuilder,
    private clientsService: ClientsService,
    private router: Router,
    private searchService: SearchService,
    private paginationService: PaginationService,
    public exportService: ExportService,
  ) {
    super();
    // FormGroup para búsqueda
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });

    // FormGroup para filtros
    this.filtersForm = this.fb.group({
      selectedType: [''],
      selectedProvince: ['']
    });

    // FormGroup para paginación
    this.paginationForm = this.fb.group({
      itemsPerPage: [5]
    });
  };

  // Implementar métodos abstractos
  getFilteredData(): Clients[] {
    return this.filteredClients;
  }

  getCurrentPageData(): Clients[] {
    return this.clients;
  }

  getPaginationConfig(): PaginationConfig {
    return this.paginationConfig;
  }


  ngOnInit(): void {
    this.getListClients();
    this.setupFormSubscriptions();

  }

  // ==========================================
  // MÉTODOS DE CONFIGURACIÓN
  // ==========================================

  /**
   * Configura las suscripciones reactivas para los FormGroups
   */
  setupFormSubscriptions(): void {
    // Suscripción para búsqueda en tiempo real
    this.searchForm.get('searchTerm')?.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    // Suscripción para cambios en filtros
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
  // MÉTODOS DE CARGA DE DATOS
  // ==========================================

  /**
   * Obtiene todos los clientes del servidor
   */
  getListClients() {
    this.clientsService.getClients().subscribe({
      next: (clientList) => {
        this.allClients = clientList;
        this.extractProvinceOptions();
        this.applyFilters();
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  // ==========================================
  // MÉTODOS DE FILTRADO Y BÚSQUEDA
  // ==========================================

  /**
   * Extrae las provincias únicas de los clientes para el filtro
   */
  extractProvinceOptions() {
    const provinces = this.allClients
      .map(client => client.province)
      .filter((province, index, array) => province && array.indexOf(province) === index)
      .sort();

    this.provinceOptions = provinces;
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters() {
    // Resetear cada FormGroup por separado con valores explícitos
    this.searchForm.patchValue({
      searchTerm: ''
    });
    this.filtersForm.patchValue({
      selectedType: '',
      selectedProvince: ''
    })
  }

  /**
   * Aplica todos los filtros y actualiza la paginación
   */
  applyFilters() {
    let filtered = [...this.allClients];

    // Obtener valores directamente de cada FormGroup independiente
    const searchTerm = this.searchForm.get('searchTerm')?.value;
    const selectedType = this.filtersForm.get('selectedType')?.value;
    const selectedProvince = this.filtersForm.get('selectedProvince')?.value;

    // Filtro por búsqueda de texto
    if (searchTerm?.trim()) {
      filtered = this.searchService.filterWithFullName(
        filtered,
        searchTerm,
        'name',
        'lastname',
        ['identification', 'phone', 'company_name', 'email']
      );
    }

    // Filtro por tipo de cliente
    if (selectedType) {
      filtered = filtered.filter(client => client.type_client === selectedType);
    }

    // Filtro por provincia
    if (selectedProvince) {
      filtered = filtered.filter(client => client.province === selectedProvince);
    }

    this.filteredClients = filtered;
    this.paginationConfig.totalItems = filtered.length;
    this.paginationConfig.currentPage = 1;
    this.updatePagination();

  }

  // ==========================================
  // MÉTODOS DE PAGINACIÓN
  // ==========================================

  /**
   * Actualiza la paginación con los datos filtrados
   */
  updatePagination() {
    this.paginationResult = this.paginationService.paginate(
      this.filteredClients,
      this.paginationConfig
    );
    this.clients = this.paginationResult.items;
  }

  /**
   * Navega a una página específica
   */
  goToPage(page: number) {
    if (this.paginationService.isValidPage(page, this.paginationResult.totalPages)) {
      this.paginationConfig.currentPage = page;
      this.paginationForm.patchValue({
        itemsPerPage: 5,
      }, {emitEvent: false});
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
  }

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
      this.clients.length
    );
  }

  // ==========================================
  // MÉTODOS DE ACCIONES
  // ==========================================

  /**
   * Navega a la página de edición de cliente
   */
  editClient(id: number) {
    this.router.navigate(['/dashboards/clients/edit', id]);
  }

  /**
   * Elimina un cliente después de confirmar la acción
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
        this.clientsService.deleleteUser(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado.',
              text: 'Cliente eliminado correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
            this.getListClients();
          },
          error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        });
      }
    });
  }

  /**
   * Navega al registro de nuevo cliente
   */
  newClient() {
    this.router.navigate(['/dashboards/clients/register']);
  }

}
