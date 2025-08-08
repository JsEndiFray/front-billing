import {Component, OnInit} from '@angular/core';
import {CLIENT_TYPE_LABELS, Clients} from '../../../interface/clientes-interface';
import {ClientsService} from '../../../core/services/clients-services/clients.service';
import {HttpErrorResponse} from '@angular/common/http';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import Swal from 'sweetalert2';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {SearchService} from '../../../core/services/shared-services/search.service';
import {PaginationConfig, PaginationResult} from '../../../interface/pagination-interface';
import {PaginationService} from '../../../core/services/shared-services/pagination.service';

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

  // Lista de clientes que se muestra en la tabla
  clients: Clients[] = [];

  // Lista completa de clientes (datos originales sin filtrar)
  allClients: Clients[] = [];

  // Texto que escribe el usuario para buscar
  searchTerm: string = '';

  // Lista de clientes filtrados (antes de paginar)
  filteredClients: Clients[] = [];

// Filtros
  selectedType: string = '';
  selectedProvince: string = '';

// Opciones para filtros
  provinceOptions: string[] = [];
  clientTypeOptions: Array<'particular' | 'autonomo' | 'empresa'> = [];

  // LABEL PARA MONSTRAR
  clientTypeLabels = CLIENT_TYPE_LABELS;

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


  constructor(
    private clientsService: ClientsService,
    private router: Router,
    private searchService: SearchService,
    private paginationService: PaginationService,
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
      next: (clientList) => {
        this.allClients = clientList;
        this.extractProvinceOptions();
        this.extractTypeOptions();
        this.applyFilters();
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  }

  /**
   * Extrae las provincias únicas de los clientes para el filtro
   */
  extractProvinceOptions() {
    // Toma todos los clientes y extrae solo las provincias
    const provinces = this.allClients
      .map(client => client.province)
      // Elimina duplicados y valores vacíos
      .filter((province, index, array) => province && array.indexOf(province) === index)
      // Ordena alfabéticamente
      .sort();

    this.provinceOptions = provinces;
  }

  /**
   * Extrae los tipos unicos
   */
  extractTypeOptions() {
    this.clientTypeOptions = ['particular', 'autonomo', 'empresa'];
  }


  /**
   * Aplica todos los filtros y actualiza la paginación
   */
  applyFilters() {
    let filtered = [...this.allClients];

    // Filtro por búsqueda de texto (tu lógica actual)
    if (this.searchTerm.trim()) {
      filtered = this.searchService.filterWithFullName(
        filtered,
        this.searchTerm,
        'name',
        'lastname',
        ['identification', 'phone', 'company_name', 'email']
      );
    }

    // Filtro por tipo de cliente
    if (this.selectedType) {
      filtered = filtered.filter(client => client.type_client === this.selectedType);
    }

    // Filtro por provincia
    if (this.selectedProvince) {
      filtered = filtered.filter(client => client.province === this.selectedProvince);
    }

    this.filteredClients = filtered;
    this.paginationConfig.totalItems = filtered.length;
    this.paginationConfig.currentPage = 1; // Resetear a primera página
    this.updatePagination();
  }

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
   * Se ejecuta cuando cambia el filtro de tipo
   */
  onTypeFilterChange() {
    this.applyFilters();
  }

  /**
   * Se ejecuta cuando cambia el filtro de provincia
   */
  onProvinceFilterChange() {
    this.applyFilters();
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters() {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedProvince = '';
    this.applyFilters();
  }

  /**
   * Limpia el filtro de búsqueda y muestra todos los propietarios
   */
  clearSearch() {
    this.searchTerm = '';
    this.applyFilters()
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

  /**
   * Se ejecuta cada vez que el usuario escribe en el buscador
   */
  onSearchChange() {
    this.applyFilters();
  }


  /**
   * Navega a la página de edición de cliente
   */
  editClient(id: number) {
    this.router.navigate(['/dashboards/clients/edit', id])
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

  newClient() {
    this.router.navigate(['/dashboards/clients/register'])
  }
}
