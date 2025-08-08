import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Employee} from '../../../interface/employee-interface';
import {EmployeeService} from '../../../core/services/employee-services/employee.service';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {SearchService} from '../../../core/services/shared-services/search.service';
import Swal from 'sweetalert2';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import {PaginationConfig, PaginationResult} from '../../../interface/pagination-interface';
import {PaginationService} from '../../../core/services/shared-services/pagination.service';

/**
 * Componente para mostrar y gestionar la lista de empleados
 * Permite buscar, editar empleados
 */
@Component({
  selector: 'app-employee-list',
  imports: [
    FormsModule,
    DataFormatPipe
  ],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.css'
})
export class EmployeeListComponent implements OnInit {

  // Lista de propietarios que se muestra en la tabla
  employees: Employee[] = [];

  // Lista completa de propietarios (datos originales sin filtrar)
  allEmployees: Employee[] = [];

  // Texto que escribe el usuario para buscar
  searchTerm: string = '';

  // Lista de clientes filtrados (antes de paginar)
  filteredEmployee: Employee[] = [];

// Filtros
  selectedProvince: string = '';

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

  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    private searchService: SearchService,
    private paginationService: PaginationService,
  ) {
  }

  ngOnInit(): void {
    this.getListEmployee();
  }

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

  //==========================
  // PROCESO DE LOS FILTROS
  //==========================
  /**
   * Limpia el filtro de búsqueda
   */
  clearFilters() {
    this.searchTerm = '';
    this.selectedProvince = '';
    this.applyFilters();
  }

  /**
   * Se ejecuta cada vez que cambia algún filtro o el término de búsqueda.
   * Aplica todos los filtros disponibles para actualizar.
   */
  onFilterCharger() {
    this.applyFilters();
  }



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
   * Filtra la lista de empleados según el texto de búsqueda
   * Busca en: nombre completo, identificación y teléfono
   */
  applyFilters() {
    let filtered = [...this.allEmployees];

    // Filtro por búsqueda de texto
    if (this.searchTerm.trim()) {
      filtered = this.searchService.filterWithFullName(
        filtered,
        this.searchTerm,
        `name`,
        'lastname',
        ['phone', 'identification']
      );
    }
    // Filtro por provincia
    if (this.selectedProvince) {
      filtered = filtered.filter(employee => employee.province === this.selectedProvince);
    }

    this.filteredEmployee = filtered;
    this.paginationConfig.totalItems = filtered.length;
    this.paginationConfig.currentPage = 1; // Resetear a primera página
    this.updatePagination();
  }

  //==============
  // PAGINACION
  //==============

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



  //========
  // CRUD
  //========


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
  }

}
