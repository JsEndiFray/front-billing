import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {CLIENT_TYPE_LABELS, Clients} from '../../../interfaces/clientes-interface';
import {ClientsService} from '../../../core/services/clients-services/clients.service';
import {HttpErrorResponse} from '@angular/common/http';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import Swal from 'sweetalert2';
import {Router} from '@angular/router';
import {SearchService} from '../../../core/services/shared-services/search.service';
import {PaginationConfig, PaginationResult} from '../../../interfaces/pagination-interface';
import {PaginationService} from '../../../core/services/shared-services/pagination.service';


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
export class ClientsListComponent implements OnInit {

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
  clientTypeOptions: Array<'particular' | 'autonomo' | 'empresa'> = [];

  // LABEL PARA MOSTRAR
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
    private fb: FormBuilder,
    private clientsService: ClientsService,
    private router: Router,
    private searchService: SearchService,
    private paginationService: PaginationService,
  ) {
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
      itemsPerPage: [5],
      currentPage: [1]
    });

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
        this.extractTypeOptions();
        this.applyFilters();
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

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
   * Extrae los tipos únicos
   */
  extractTypeOptions() {
    this.clientTypeOptions = ['particular', 'autonomo', 'empresa'];
  }

  // ==========================================
  // MÉTODOS DE FILTRADO Y BÚSQUEDA
  // ==========================================

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

  /**
   * Limpia el filtro de búsqueda
   */
  clearSearch() {
    this.searchForm.patchValue({
      searchTerm: ''
    });
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
        currentPage: page
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
  // MÉTODOS DE VALIDACIÓN
  // ==========================================

  /**
   * Verifica si un campo específico de un FormGroup es inválido para mostrar errores
   * @param formGroup - El FormGroup a validar (searchForm, filtersForm, paginationForm)
   * @param fieldName - Nombre del campo a validar
   */

  /**
   * Verifica si un campo es inválido para mostrar errores
   */
  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Verifica si el formulario de búsqueda es válido
   */
  isSearchFormValid(): boolean {
    return this.searchForm.valid;
  }

  /**
   * Verifica si el formulario de filtros es válido
   */
  isFiltersFormValid(): boolean {
    return this.filtersForm.valid;
  }

  /**
   * Verifica si el formulario de paginación es válido
   */
  isPaginationFormValid(): boolean {
    return this.paginationForm.valid;
  }

  /**
   * Verifica si todos los formularios son válidos
   */
  areAllFormsValid(): boolean {
    const searchValid = this.isSearchFormValid();
    const filtersValid = this.isFiltersFormValid();
    const paginationValid = this.isPaginationFormValid();
    return searchValid && filtersValid && paginationValid;
  }

  /**
   * Marca todos los campos de un FormGroup como touched para mostrar errores
   * @param formGroup - El FormGroup a marcar
   */
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Marca todos los formularios como touched
   */
  markAllFormsTouched(): void {
    this.markFormGroupTouched(this.searchForm);
    this.markFormGroupTouched(this.filtersForm);
    this.markFormGroupTouched(this.paginationForm);
  }

  /**
   * Resetea un FormGroup específico
   * @param formGroup - El FormGroup a resetear
   */
  resetFormGroup(formGroup: FormGroup): void {
    formGroup.reset();
  }

  /**
   * Resetea todos los formularios independientes
   */
  resetAllForms(): void {
    this.searchForm.reset();
    this.filtersForm.reset();
    this.paginationForm.reset();

    // Aplicar valores por defecto después del reset
    this.paginationForm.patchValue({
      itemsPerPage: 5,
      currentPage: 1
    });

    console.log('Todos los formularios han sido reseteados');
  }

  /**
   * Verifica si hay datos en el formulario de búsqueda
   */
  hasSearchData(): boolean {
    const searchTerm = this.searchForm.get('searchTerm')?.value;
    return searchTerm && searchTerm.trim() !== '';
  }

  /**
   * Verifica si hay filtros aplicados
   */
  hasFiltersApplied(): boolean {
    const selectedType = this.filtersForm.get('selectedType')?.value;
    const selectedProvince = this.filtersForm.get('selectedProvince')?.value;
    return (selectedType && selectedType !== '') || (selectedProvince && selectedProvince !== '');
  }

  /**
   * Verifica si se han aplicado búsqueda o filtros
   */
  hasAnyFilterOrSearch(): boolean {
    return this.hasSearchData() || this.hasFiltersApplied();
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

  /**
   * Exporta los datos filtrados
   */
  exportData() {
    // Implementar lógica de exportación aquí
    console.log('Exportando datos:', this.filteredClients);
  }

  // ==========================================
  // GETTERS PARA ACCESO FÁCIL A VALORES
  // ==========================================

  /**
   * Getter para obtener el valor del campo de búsqueda
   */
  get searchTerm(): string {
    return this.searchForm.get('searchTerm')?.value || '';
  }

  /**
   * Getter para obtener el tipo seleccionado en filtros
   */
  get selectedType(): string {
    return this.filtersForm.get('selectedType')?.value || '';
  }

  /**
   * Getter para obtener la provincia seleccionada en filtros
   */
  get selectedProvince(): string {
    return this.filtersForm.get('selectedProvince')?.value || '';
  }

  /**
   * Getter para obtener items por página de paginación
   */
  get itemsPerPage(): number {
    return this.paginationForm.get('itemsPerPage')?.value || 5;
  }

  /**
   * Getter para obtener la página actual de paginación
   */
  get currentPage(): number {
    return this.paginationForm.get('currentPage')?.value || 1;
  }
}
