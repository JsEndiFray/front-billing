import {Component, OnInit, signal, computed, effect, inject, DestroyRef} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {SuppliersService} from '../../../../core/services/entity-services/suppliers.service';
import {Router} from '@angular/router';
import {SearchService} from '../../../../core/services/shared-services/search.service';
import {PaginationService} from '../../../../core/services/shared-services/pagination.service';
import {ExportService} from '../../../../core/services/shared-services/exportar.service';
import {Suppliers} from '../../../../interfaces/suppliers-interface';
import {ACTIVE_STATUS_LABELS, PAYMENT_TERMS_LABELS} from '../../../../shared/Collection-Enum/collection-enum';
import {PaginationConfig} from '../../../../interfaces/pagination-interface';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';
import {NgClass} from '@angular/common';
import {ExportableListBase} from '../../../../shared/Base/exportable-list.base';

@Component({
  selector: 'app-suppliers-list',
  imports: [
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './suppliers-list.component.html',
  styleUrl: './suppliers-list.component.css'
})
export class SuppliersListComponent extends ExportableListBase<Suppliers> implements OnInit {

  // ==========================================
  // INYECCIÓN DE DEPENDENCIAS
  // ==========================================
  private readonly suppliersService = inject(SuppliersService);
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);
  private readonly paginationService = inject(PaginationService);
  public readonly exportService = inject(ExportService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  // ==========================================
  // SIGNALS - DATOS PRINCIPALES
  // ==========================================
  readonly allSuppliers = signal<Suppliers[]>([]);

  // ==========================================
  // SIGNALS - FILTROS
  // ==========================================
  readonly searchTerm = signal<string>('');
  readonly selectedActiveStatus = signal<string>('');
  readonly selectedPaymentTerms = signal<string>('');

  // ==========================================
  // SIGNALS - PAGINACIÓN
  // ==========================================
  readonly currentPage = signal<number>(1);
  readonly itemsPerPage = signal<number>(5);

  // ==========================================
  // COMPUTED - CÁLCULOS REACTIVOS
  // ==========================================

  /**
   * Proveedores filtrados según búsqueda y filtros
   */
  readonly filteredSuppliers = computed(() => {
    let filtered = [...this.allSuppliers()];

    const search = this.searchTerm().trim();
    if (search) {
      filtered = this.searchService.filterData(
        filtered,
        search,
        ['name', 'company_name', 'tax_id', 'email', 'city', 'contact_person']
      );
    }

    const activeStatus = this.selectedActiveStatus();
    if (activeStatus !== '') {
      const isActive = activeStatus === 'true';
      filtered = filtered.filter(supplier => supplier.active === isActive);
    }

    const paymentTerms = this.selectedPaymentTerms();
    if (paymentTerms !== '') {
      filtered = filtered.filter(supplier =>
        supplier.payment_terms === Number(paymentTerms)
      );
    }

    return filtered;
  });

  /**
   * Total de items filtrados
   */
  readonly totalFilteredItems = computed(() => this.filteredSuppliers().length);

  /**
   * Total de páginas
   */
  readonly totalPages = computed(() =>
    Math.ceil(this.totalFilteredItems() / this.itemsPerPage())
  );

  /**
   * Proveedores de la página actual
   */
  readonly currentPageSuppliers = computed(() => {
    const filtered = this.filteredSuppliers();
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
  // LABELS (enums importados)
  // ==========================================
  readonly activeStatusLabels = ACTIVE_STATUS_LABELS;
  readonly paymentTermsLabels = PAYMENT_TERMS_LABELS;

  // ==========================================
  // EXPORTACIÓN (ExportableListBase)
  // ==========================================
  readonly entityName = 'proveedores';
  selectedItems: Set<number> = new Set();

  readonly exportColumns = [
    {key: 'id', title: 'ID', width: 10},
    {key: 'name', title: 'Nombre', width: 25},
    {key: 'company_name', title: 'Empresa', width: 25},
    {key: 'tax_id', title: 'CIF/NIF', width: 15},
    {key: 'email', title: 'Email', width: 25},
    {key: 'phone', title: 'Teléfono', width: 15},
    {key: 'city', title: 'Ciudad', width: 20},
    {key: 'payment_terms', title: 'Días Pago', width: 12},
    {
      key: 'active', title: 'Estado', width: 12, formatter: (value: unknown) => value ? 'Activo' : 'Inactivo'
    }
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
      selectedActiveStatus: [''],
      selectedPaymentTerms: ['']
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

    this.filtersForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(values => {
        this.selectedActiveStatus.set(values.selectedActiveStatus || '');
        this.selectedPaymentTerms.set(values.selectedPaymentTerms || '');
      });

    this.paginationForm.get('itemsPerPage')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.itemsPerPage.set(value);
        this.currentPage.set(1);
      });

    // Resetear página cuando cambian los filtros
    effect(() => {
      this.searchTerm();
      this.selectedActiveStatus();
      this.selectedPaymentTerms();
      this.currentPage.set(1);
    });
  }

  ngOnInit(): void {
    this.loadSuppliers();
  }

  // ==========================================
  // IMPLEMENTAR MÉTODOS ABSTRACTOS (ExportableListBase)
  // ==========================================

  getFilteredData(): Suppliers[] {
    return this.filteredSuppliers();
  }

  getCurrentPageData(): Suppliers[] {
    return this.currentPageSuppliers();
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
   * Carga todos los proveedores del servidor
   */
  loadSuppliers(): void {
    this.suppliersService.getAllSuppliersIncludingInactive()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.allSuppliers.set(data),
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
    this.selectedActiveStatus.set('');
    this.selectedPaymentTerms.set('');

    this.searchForm.patchValue({searchTerm: ''}, {emitEvent: false});
    this.filtersForm.patchValue({
      selectedActiveStatus: '',
      selectedPaymentTerms: ''
    }, {emitEvent: false});
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
   * Navega a la página de registro
   */
  createNewSupplier(): void {
    this.router.navigate(['/dashboards/suppliers/register']);
  }

  /**
   * Navega a la página de edición
   */
  editSupplier(id: number): void {
    this.router.navigate(['/dashboards/suppliers/edit', id]);
  }

  /**
   * Desactiva un proveedor (borrado lógico)
   */
  deleteSupplier(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'El proveedor se marcará como inactivo',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.suppliersService.deleteSupplier(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              Swal.fire({
                title: 'Desactivado',
                text: 'El proveedor se ha desactivado correctamente',
                icon: 'success',
                confirmButtonText: 'Ok'
              });
              this.loadSuppliers();
            },
            error: (e: HttpErrorResponse) => {
              // Error manejado por interceptor
            }
          });
      }
    });
  }

  /**
   * Reactiva un proveedor inactivo
   */
  activateSupplier(id: number): void {
    Swal.fire({
      title: '¿Reactivar proveedor?',
      text: 'El proveedor volverá a estar disponible',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.suppliersService.activateSupplier(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              Swal.fire({
                title: 'Reactivado',
                text: 'El proveedor se ha reactivado correctamente',
                icon: 'success',
                confirmButtonText: 'Ok'
              });
              this.loadSuppliers();
            },
            error: (e: HttpErrorResponse) => {
              // Error manejado por interceptor
            }
          });
      }
    });
  }

  // ==========================================
  // MÉTODOS AUXILIARES
  // ==========================================

  /**
   * Obtiene el nombre para mostrar (prioriza company_name)
   */
  getDisplayName(supplier: Suppliers): string {
    return supplier.company_name || supplier.name || '';
  }

  /**
   * Obtiene la etiqueta del estado activo
   */
  getActiveLabel(active: boolean | undefined): string {
    return this.activeStatusLabels.find(item => item.value === active)?.label || '-';
  }

  /**
   * Obtiene la clase CSS para el badge de estado
   */
  getActiveStatusClass(active: boolean | undefined): string {
    return active ? 'active-badge' : 'inactive-badge';
  }
}
