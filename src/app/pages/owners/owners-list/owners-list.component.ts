import {Component, OnInit, signal, computed, effect, inject, DestroyRef} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Owners} from '../../../interfaces/owners-interface';
import {OwnersService} from '../../../core/services/entity-services/owners.service';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';
import {SearchService} from '../../../core/services/shared-services/search.service';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import {Router} from '@angular/router';
import {PaginationConfig} from '../../../interfaces/pagination-interface';
import {PaginationService} from '../../../core/services/shared-services/pagination.service';
import {ExportService} from '../../../core/services/shared-services/exportar.service';
import {ExportableListBase} from '../../../shared/Base/exportable-list.base';

/**
 * Componente para mostrar y gestionar la lista de propietarios
 * Permite buscar, editar y eliminar propietarios con datos completos
 */
@Component({
  selector: 'app-owners-list',
  imports: [
    ReactiveFormsModule,
    DataFormatPipe
  ],
  templateUrl: './owners-list.component.html',
  styleUrl: './owners-list.component.css'
})
export class OwnersListComponent extends ExportableListBase<Owners> implements OnInit {

  // ==========================================
  // INYECCIÓN DE DEPENDENCIAS
  // ==========================================
  private readonly ownersService = inject(OwnersService);
  private readonly searchService = inject(SearchService);
  private readonly router = inject(Router);
  private readonly paginationService = inject(PaginationService);
  public readonly exportService = inject(ExportService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  // ==========================================
  // SIGNALS - DATOS PRINCIPALES
  // ==========================================
  readonly allOwners = signal<Owners[]>([]);

  // ==========================================
  // SIGNALS - FILTROS
  // ==========================================
  readonly searchTerm = signal<string>('');

  // ==========================================
  // SIGNALS - PAGINACIÓN
  // ==========================================
  readonly currentPage = signal<number>(1);
  readonly itemsPerPage = signal<number>(5);

  // ==========================================
  // COMPUTED - CÁLCULOS REACTIVOS
  // ==========================================

  /**
   * Propietarios filtrados según búsqueda
   */
  readonly filteredOwners = computed(() => {
    let filtered = [...this.allOwners()];

    const search = this.searchTerm().trim();
    if (search) {
      filtered = this.searchService.filterWithFullName(
        filtered,
        search,
        'name',
        'lastname',
        ['identification', 'phone']
      );
    }

    return filtered;
  });

  /**
   * Total de items filtrados
   */
  readonly totalFilteredItems = computed(() => this.filteredOwners().length);

  /**
   * Total de páginas
   */
  readonly totalPages = computed(() =>
    Math.ceil(this.totalFilteredItems() / this.itemsPerPage())
  );

  /**
   * Propietarios de la página actual
   */
  readonly currentPageOwners = computed(() => {
    const filtered = this.filteredOwners();
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
  readonly entityName = 'propietarios';
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
  readonly filtersForm: FormGroup;   // vacío — solo referenciado por el template
  readonly paginationForm: FormGroup;

  constructor() {
    super();

    this.searchForm = this.fb.group({
      searchTerm: ['']
    });

    this.filtersForm = this.fb.group({});

    this.paginationForm = this.fb.group({
      itemsPerPage: [5]
    });

    // ==========================================
    // SUSCRIPCIONES - SINCRONIZAR FORMULARIOS CON SIGNALS
    // ==========================================

    this.searchForm.get('searchTerm')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.searchTerm.set(value || ''));

    this.paginationForm.get('itemsPerPage')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.itemsPerPage.set(value);
        this.currentPage.set(1);
      });

    // Resetear página cuando cambia la búsqueda
    effect(() => {
      this.searchTerm();
      this.currentPage.set(1);
    });
  }

  ngOnInit(): void {
    this.loadOwners();
  }

  // ==========================================
  // IMPLEMENTAR MÉTODOS ABSTRACTOS (ExportableListBase)
  // ==========================================

  getFilteredData(): Owners[] {
    return this.filteredOwners();
  }

  getCurrentPageData(): Owners[] {
    return this.currentPageOwners();
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
   * Carga todos los propietarios del servidor
   */
  loadOwners(): void {
    this.ownersService.getOwners()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.allOwners.set(data),
        error: (e: HttpErrorResponse) => {
          // Error manejado por interceptor
        }
      });
  }

  // ==========================================
  // MÉTODOS DE FILTROS
  // ==========================================

  /**
   * Limpia el filtro de búsqueda
   */
  clearFilters(): void {
    this.searchTerm.set('');
    this.searchForm.patchValue({searchTerm: ''}, {emitEvent: false});
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
   * Navega a la página de edición de propietario
   */
  editOwner(id: number): void {
    this.router.navigate(['/dashboards/owners/edit', id]);
  }

  /**
   * Navega a la página de registro
   */
  newOwners(): void {
    this.router.navigate(['/dashboards/owners/register']);
  }

  /**
   * Elimina un propietario después de confirmar la acción
   */
  deleteOwner(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ownersService.deleteOwner(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              Swal.fire({
                title: 'Eliminado.',
                text: 'Propietario eliminado correctamente',
                icon: 'success',
                confirmButtonText: 'Ok'
              });
              this.loadOwners();
            },
            error: (e: HttpErrorResponse) => {
              // Error manejado por interceptor
            }
          });
      }
    });
  }
}
