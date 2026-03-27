import {Component, OnInit, signal, computed, effect, inject, DestroyRef} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Employee} from '../../../interfaces/employee-interface';
import {EmployeeService} from '../../../core/services/entity-services/employee.service';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {SearchService} from '../../../core/services/shared-services/search.service';
import {PaginationService} from '../../../core/services/shared-services/pagination.service';
import {ExportableListBase} from '../../../shared/Base/exportable-list.base';
import {ExportService} from '../../../core/services/shared-services/exportar.service';
import {PaginationConfig} from '../../../interfaces/pagination-interface';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import Swal from 'sweetalert2';

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
  // INYECCIÓN DE DEPENDENCIAS
  // ==========================================
  private readonly employeeService = inject(EmployeeService);
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);
  private readonly paginationService = inject(PaginationService);
  public readonly exportService = inject(ExportService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  // ==========================================
  // SIGNALS - DATOS PRINCIPALES
  // ==========================================
  readonly allEmployees = signal<Employee[]>([]);

  // ==========================================
  // SIGNALS - FILTROS
  // ==========================================
  readonly searchTerm = signal<string>('');
  readonly selectedProvince = signal<string>('');

  // ==========================================
  // SIGNALS - PAGINACIÓN
  // ==========================================
  readonly currentPage = signal<number>(1);
  readonly itemsPerPage = signal<number>(5);

  // ==========================================
  // COMPUTED - CÁLCULOS REACTIVOS
  // ==========================================

  /**
   * Opciones de provincia únicas extraídas de los datos cargados
   */
  readonly provinceOptions = computed(() =>
    this.allEmployees()
      .map(e => e.province)
      .filter((province, index, array) => province && array.indexOf(province) === index)
      .sort() as string[]
  );

  /**
   * Empleados filtrados según búsqueda y provincia
   */
  readonly filteredEmployees = computed(() => {
    let filtered = [...this.allEmployees()];

    const search = this.searchTerm().trim();
    if (search) {
      filtered = this.searchService.filterWithFullName(
        filtered,
        search,
        'name',
        'lastname',
        ['phone', 'identification']
      );
    }

    const province = this.selectedProvince();
    if (province) {
      filtered = filtered.filter(e => e.province === province);
    }

    return filtered;
  });

  /**
   * Total de items filtrados
   */
  readonly totalFilteredItems = computed(() => this.filteredEmployees().length);

  /**
   * Total de páginas
   */
  readonly totalPages = computed(() =>
    Math.ceil(this.totalFilteredItems() / this.itemsPerPage())
  );

  /**
   * Empleados de la página actual
   */
  readonly currentPageEmployees = computed(() => {
    const filtered = this.filteredEmployees();
    const page = this.currentPage();
    const perPage = this.itemsPerPage();
    const startIndex = (page - 1) * perPage;
    return filtered.slice(startIndex, startIndex + perPage);
  });

  /**
   * Información de paginación
   */
  readonly paginationInfo = computed(() => {
    const page = this.currentPage();
    const perPage = this.itemsPerPage();
    const total = this.totalFilteredItems();
    const totalPgs = this.totalPages();
    const startIndex = (page - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, total);

    return {
      currentPage: page,
      totalPages: totalPgs,
      startIndex: startIndex + 1,
      endIndex,
      totalItems: total,
      hasNext: page < totalPgs,
      hasPrevious: page > 1
    };
  });

  /**
   * Páginas visibles para navegación
   */
  readonly visiblePages = computed(() =>
    this.paginationService.getVisiblePages(this.currentPage(), this.totalPages(), 5)
  );

  // ==========================================
  // EXPORTACIÓN (ExportableListBase)
  // ==========================================
  readonly entityName = 'empleados';
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

  // ==========================================
  // FORMULARIOS (puente UI → Signals)
  // ==========================================
  readonly searchForm: FormGroup;
  readonly filtersForm: FormGroup;
  readonly paginationForm: FormGroup;

  constructor() {
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

    // ==========================================
    // SUSCRIPCIONES - SINCRONIZAR FORMULARIOS CON SIGNALS
    // ==========================================

    this.searchForm.get('searchTerm')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.searchTerm.set(value || ''));

    this.filtersForm.get('selectedProvince')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.selectedProvince.set(value || ''));

    this.paginationForm.get('itemsPerPage')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.itemsPerPage.set(value);
        this.currentPage.set(1);
      });

    // Resetear página cuando cambian los filtros
    effect(() => {
      this.searchTerm();
      this.selectedProvince();
      this.currentPage.set(1);
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  // ==========================================
  // IMPLEMENTAR MÉTODOS ABSTRACTOS (ExportableListBase)
  // ==========================================

  getFilteredData(): Employee[] {
    return this.filteredEmployees();
  }

  getCurrentPageData(): Employee[] {
    return this.currentPageEmployees();
  }

  getPaginationConfig(): PaginationConfig {
    return {
      currentPage: this.currentPage(),
      itemsPerPage: this.itemsPerPage(),
      totalItems: this.totalFilteredItems()
    };
  }

  // ==========================================
  // MÉTODOS DE CARGA DE DATOS
  // ==========================================

  /**
   * Carga todos los empleados del servidor
   */
  loadEmployees(): void {
    this.employeeService.getEmployee()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.allEmployees.set(data),
        error: (e: HttpErrorResponse) => {
          // Error manejado por interceptor
        }
      });
  }

  // ==========================================
  // MÉTODOS DE FILTROS
  // ==========================================

  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedProvince.set('');

    this.searchForm.patchValue({searchTerm: ''}, {emitEvent: false});
    this.filtersForm.patchValue({selectedProvince: ''}, {emitEvent: false});
  }

  // ==========================================
  // MÉTODOS DE PAGINACIÓN
  // ==========================================

  /**
   * Navega a una página específica
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  /**
   * Navega a la página anterior
   */
  previousPage(): void {
    if (this.paginationInfo().hasPrevious) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  /**
   * Navega a la página siguiente
   */
  nextPage(): void {
    if (this.paginationInfo().hasNext) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  /**
   * Obtiene el texto informativo de paginación
   */
  getPaginationText(): string {
    const info = this.paginationInfo();
    if (info.totalItems === 0) return 'No hay elementos';
    return `Mostrando ${info.startIndex}-${info.endIndex} de ${info.totalItems}`;
  }

  // ==========================================
  // MÉTODOS DE NAVEGACIÓN Y CRUD
  // ==========================================

  /**
   * Navega a la página de edición del empleado
   */
  editEmployee(id: number): void {
    this.router.navigate(['/dashboards/employee/edit', id]);
  }

  /**
   * Navega a la página de registro
   */
  newEmployee(): void {
    this.router.navigate(['/dashboards/employee/register']);
  }

  /**
   * Elimina un empleado después de confirmar la acción
   */
  deleteEmployee(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.employeeService.deleteEmployee(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              Swal.fire({
                title: 'Eliminado.',
                text: 'Empleado eliminado correctamente',
                icon: 'success',
                confirmButtonText: 'Ok'
              });
              this.loadEmployees();
            },
            error: (e: HttpErrorResponse) => {
              // Error manejado por interceptor
            }
          });
      }
    });
  }
}
