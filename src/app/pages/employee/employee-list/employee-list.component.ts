import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Employee} from '../../../interfaces/employee-interface';
import {EmployeeService} from '../../../core/services/entity-services/employee.service';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {SearchService} from '../../../core/services/shared-services/search.service';
import Swal from 'sweetalert2';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import {PaginationConfig, PaginationResult} from '../../../interfaces/pagination-interface';
import {PaginationService} from '../../../core/services/shared-services/pagination.service';
import {ExportableListBase} from '../../../shared/Base/exportable-list.base';
import {ExportService} from '../../../core/services/shared-services/exportar.service';

/**
 * Componente para mostrar y gestionar la lista de empleados
 * Permite buscar, editar empleados
 */
@Component({
  selector: 'app-employee-list',
  imports: [
    DataFormatPipe,
    ReactiveFormsModule,
  ],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.css'
})
export class EmployeeListComponent extends ExportableListBase<Employee> implements OnInit {

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
  employees: Employee[] = [];

  // Lista completa de propietarios (datos originales sin filtrar)
  allEmployees: Employee[] = [];

  // Lista de clientes filtrados (antes de paginar)
  filteredEmployee: Employee[] = [];

  // Opciones para filtros
  provinceOptions: string[] = [];

  // Configuración de paginación
  paginationConfig: PaginationConfig = {
    currentPage: 1,
    itemsPerPage: 3,
    totalItems: 0
  };

// Resultado de paginación
  paginationResult: PaginationResult<Employee> = {
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
  entityName = 'empleados'; //para nombrar los documentos descargados
  selectedItems: Set<number> = new Set();

  readonly exportColumns = [
    {key: 'id', title: 'ID', width: 10},
    {key: 'name', title: 'Nombre', width: 20},
    {key: 'lastname', title: 'Apellidos', width: 20},
    {key: 'email', title: 'Email', width: 25},
    {key: 'identification', title: 'Identificación', width: 15},
    {key: 'phone', title: 'Teléfono', width: 15},
    {key: 'address', title: 'Dirección', width: 30},
    {key: 'postal_code', title: 'C.P.', width: 10},
    {key: 'location', title: 'Localidad', width: 20},
    {key: 'province', title: 'Provincia', width: 20},
    {key: 'country', title: 'País', width: 15}
  ];


  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    private searchService: SearchService,
    private paginationService: PaginationService,
    private fb: FormBuilder,
    public exportService: ExportService,
  ) {
    super();
    // FormGroup para búsqueda
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });

    // FormGroup para filtros
    this.filtersForm = this.fb.group({
      selectedProvince: ['']
    });

    // FormGroup para paginación
    this.paginationForm = this.fb.group({
      itemsPerPage: [5]
    });
  }

  // Implementar métodos abstractos
  getFilteredData(): Employee[] {
    return this.filteredEmployee;
  }

  getCurrentPageData(): Employee[] {
    return this.employees;
  }

  getPaginationConfig(): PaginationConfig {
    return this.paginationConfig;
  }


  ngOnInit(): void {
    this.getListEmployee();
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
  // MÉTODOS DE CARGA DE DATOS
  // ==========================================
  /**
   * Obtiene todos los empleados del servidor
   * Guarda una copia original para los filtros de búsqueda
   */
  getListEmployee() {
    this.employeeService.getEmployee().subscribe({
      next: (employeeList) => {
        this.allEmployees = employeeList;
        this.extractProvinceOptions();
        this.applyFilters();
      }, error: (e: HttpErrorResponse) => {
      }
    })
  }

  // ==========================================
  // MÉTODOS DE FILTROS Y BÚSQUEDA
  // ==========================================

  /**
   * Extrae las provincias únicas de los clientes para el filtro
   */
  extractProvinceOptions() {
    // Toma todos los clientes y extrae solo las provincias
    const provinces = this.allEmployees
      .map(employee => employee.province)
      // Elimina duplicados y valores vacíos
      .filter((province, index, array) => province && array.indexOf(province) === index)
      // Ordena alfabéticamente
      .sort();

    this.provinceOptions = provinces;
  }

  /**
   * Limpia el filtro de búsqueda
   */
  clearFilters() {
    this.searchForm.patchValue({
      searchTerm: ''
    });
    this.filtersForm.patchValue({
      selectedProvince: ''
    })
  }


  /**
   * Filtra la lista de empleados según el texto de búsqueda
   * Busca en: nombre completo, identificación y teléfono
   */
  applyFilters() {
    let filtered = [...this.allEmployees];


    // Obtener valores directamente de cada FormGroup independiente
    const searchTerm = this.searchForm.get('searchTerm')?.value;
    const selectedProvince = this.filtersForm.get('selectedProvince')?.value;

    // Filtro por búsqueda de texto
    if (searchTerm) {
      filtered = this.searchService.filterWithFullName(
        filtered,
        searchTerm,
        `name`,
        'lastname',
        ['phone', 'identification']
      );
    }
    // Filtro por provincia
    if (selectedProvince) {
      filtered = filtered.filter(employee => employee.province === selectedProvince);
    }

    this.filteredEmployee = filtered;
    this.paginationConfig.totalItems = filtered.length;
    this.paginationConfig.currentPage = 1; // Resetear a primera página
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
      this.filteredEmployee,
      this.paginationConfig
    );
    this.employees = this.paginationResult.items;
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
      this.employees.length
    );
  }

  // ==========================================
  // MÉTODOS DE NAVEGACIÓN Y CRUD
  // ==========================================


  /**
   * Navega a la página de edición del empleado
   */
  editEmployee(id: number) {
    this.router.navigate(['/dashboards/employee/edit', id])
  }

  /**
   * Elimina un empleado después de confirmar la acción
   * Muestra mensaje de confirmación antes de eliminar
   */
  deleteEmployee(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.employeeService.deleteEmployee(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado.',
              text: 'Empleado eliminado correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
            // Recargar la lista para mostrar cambios
            this.getListEmployee();
          }, error: (e: HttpErrorResponse) => {
          }
        })
      }
    })
  }

  newEmployee() {
    this.router.navigate(['/dashboards/employee/register'])
  };

}
