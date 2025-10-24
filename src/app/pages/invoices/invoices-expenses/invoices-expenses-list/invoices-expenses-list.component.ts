import {Component, OnInit, signal, computed, effect, inject, DestroyRef} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {InternalExpense} from '../../../../interfaces/expenses-interface';
import {
  DEDUCTIBLE_LABELS,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_PAYMENT_METHOD_LABELS,
  EXPENSE_STATUS_LABELS
} from '../../../../shared/Collection-Enum/collection-enum';
import {PaginationConfig} from '../../../../interfaces/pagination-interface';
import {ExpensesService} from '../../../../core/services/entity-services/expenses.service';
import {HttpErrorResponse} from '@angular/common/http';
import {SearchService} from '../../../../core/services/shared-services/search.service';
import {PaginationService} from '../../../../core/services/shared-services/pagination.service';
import {Router} from '@angular/router';
import Swal from 'sweetalert2';
import {ExportableListBase} from '../../../../shared/Base/exportable-list.base';
import {ExportService} from "../../../../core/services/shared-services/exportar.service";
import {NgClass} from '@angular/common';
import {AuthService} from '../../../../core/services/auth-services/auth.service';
import {ExpensesUtilHelper} from '../../../../core/helpers/expense-utils.helper';

@Component({
  selector: 'app-invoices-expenses-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './invoices-expenses-list.component.html',
  styleUrl: './invoices-expenses-list.component.css'
})
export class InvoicesExpensesListComponent extends ExportableListBase<InternalExpense>{

  // ==========================================
  // INYECCIÓN DE DEPENDENCIAS
  // ==========================================
  private readonly fb = inject(FormBuilder);
  private readonly expensesService = inject(ExpensesService);
  private readonly searchService = inject(SearchService);
  private readonly paginationService = inject(PaginationService);
  private readonly router = inject(Router);
  public readonly utilService = inject(ExpensesUtilHelper);
  public readonly exportService = inject(ExportService);
  public readonly authServices = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  // ==========================================
  // SIGNALS - DATOS PRINCIPALES
  // ==========================================
  allExpenses = signal<InternalExpense[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  // ==========================================
  // SIGNALS - FILTROS
  // ==========================================
  searchTerm = signal<string>('');
  selectedCategory = signal<string>('');
  selectedStatus = signal<string>('');
  selectedDeductible = signal<string>('');

  // ==========================================
  // SIGNALS - PAGINACIÓN
  // ==========================================
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(10);

  // ==========================================
  // COMPUTED - CÁLCULOS REACTIVOS
  // ==========================================

  /**
   * Gastos filtrados según búsqueda y filtros
   */
  filteredExpenses = computed(() => {
    let filtered = [...this.allExpenses()];

    // Filtro por búsqueda de texto
    const search = this.searchTerm().trim();
    if (search) {
      filtered = this.searchService.filterData(
        filtered,
        search,
        ['description', 'supplier_name', 'supplier_nif', 'category', 'receipt_number']
      );
    }

    // Filtro por categoría
    const category = this.selectedCategory();
    if (category !== '') {
      filtered = filtered.filter(expense => expense.category === category);
    }

    // Filtro por estado
    const status = this.selectedStatus();
    if (status !== '') {
      filtered = filtered.filter(expense => expense.status === status);
    }

    // Filtro por deducible
    const deductible = this.selectedDeductible();
    if (deductible !== '') {
      const isDeductible = deductible === 'true';
      filtered = filtered.filter(expense => expense.is_deductible === isDeductible);
    }

    return filtered;
  });

  /**
   * Total de items filtrados
   */
  totalFilteredItems = computed(() => this.filteredExpenses().length);

  /**
   * Total de páginas
   */
  totalPages = computed(() =>
    Math.ceil(this.totalFilteredItems() / this.itemsPerPage())
  );

  /**
   * Gastos de la página actual
   */
  currentPageExpenses = computed(() => {
    const filtered = this.filteredExpenses();
    const page = this.currentPage();
    const perPage = this.itemsPerPage();

    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;

    return filtered.slice(startIndex, endIndex);
  });

  /**
   * Información de paginación
   */
  paginationInfo = computed(() => {
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
      endIndex: endIndex,
      totalItems: total,
      hasNext: page < totalPgs,
      hasPrevious: page > 1
    };
  });

  /**
   * Páginas visibles para navegación
   */
  visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    const maxVisible = 5;

    return this.paginationService.getVisiblePages(current, total, maxVisible);
  });

  /**
   * Estadísticas de gastos filtrados
   */
  expenseStats = computed(() => {
    return this.utilService.getExpenseStats(this.filteredExpenses());
  });

  /**
   * Total de gastos pendientes
   */
  pendingCount = computed(() => this.expenseStats().byStatus.pending);

  /**
   * Total de gastos aprobados
   */
  approvedCount = computed(() => this.expenseStats().byStatus.approved);

  /**
   * Total de gastos pagados
   */
  paidCount = computed(() => this.expenseStats().byStatus.paid);

  /**
   * Total de gastos rechazados
   */
  rejectedCount = computed(() => this.expenseStats().byStatus.rejected);

  // ==========================================
  // SIGNALS - EXPORTACIÓN
  // ==========================================
  entityName = 'gastos-internos';
  selectedItems: Set<number> = new Set();

  readonly exportColumns = [
    {key: 'id', title: 'ID', width: 10},
    {key: 'expense_date', title: 'Fecha', width: 12},
    {
      key: 'category',
      title: 'Categoría',
      width: 20,
      formatter: (value: unknown) => this.utilService.getCategoryLabel(value as string)
    },
    {key: 'description', title: 'Descripción', width: 30},
    {key: 'supplier_name', title: 'Proveedor', width: 25},
    {key: 'amount', title: 'Base', width: 12},
    {key: 'iva_amount', title: 'IVA', width: 12},
    {key: 'total_amount', title: 'Total', width: 12},
    {
      key: 'is_deductible',
      title: 'Deducible',
      width: 12,
      formatter: (value: unknown) => value ? 'Sí' : 'No'
    },
    {
      key: 'status',
      title: 'Estado',
      width: 15,
      formatter: (value: unknown) => this.utilService.getStatusLabel(value as string)
    }
  ];

  // ==========================================
  // LABELS (enums importados)
  // ==========================================
  categoryLabels = signal(EXPENSE_CATEGORY_LABELS);
  statusLabels = signal(EXPENSE_STATUS_LABELS);
  paymentMethodLabels = signal(EXPENSE_PAYMENT_METHOD_LABELS);
  deductibleLabels = signal(DEDUCTIBLE_LABELS);

  // ==========================================
  // PROPIEDADES DE FORMULARIOS (Legacy para ExportableListBase)
  // ==========================================
  searchForm: FormGroup;
  filtersForm: FormGroup;
  paginationForm: FormGroup;

  constructor() {
    super();

    // Inicializar FormGroups
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });

    this.filtersForm = this.fb.group({
      selectedCategory: [''],
      selectedStatus: [''],
      selectedDeductible: ['']
    });

    this.paginationForm = this.fb.group({
      itemsPerPage: [10]
    });

    // ==========================================
    // EFFECTS - SINCRONIZAR FORMULARIOS CON SIGNALS
    // ==========================================

    // Sincronizar búsqueda
    effect(() => {
      this.searchForm.get('searchTerm')?.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(value => this.searchTerm.set(value || ''));
    });

    // Sincronizar filtros
    effect(() => {
      this.filtersForm.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(values => {
          this.selectedCategory.set(values.selectedCategory || '');
          this.selectedStatus.set(values.selectedStatus || '');
          this.selectedDeductible.set(values.selectedDeductible || '');
        });
    });

    // Sincronizar paginación
    effect(() => {
      this.paginationForm.get('itemsPerPage')?.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(value => {
          this.itemsPerPage.set(value);
          this.currentPage.set(1); // Reset a primera página
        });
    });

    // Resetear página cuando cambian los filtros
    effect(() => {
      // Observar cambios en filtros
      this.searchTerm();
      this.selectedCategory();
      this.selectedStatus();
      this.selectedDeductible();

      // Reset a primera página
      this.currentPage.set(1);
    });
  }

  ngOnInit(): void {
    this.loadExpenses();
  }

  // ==========================================
  // IMPLEMENTAR MÉTODOS ABSTRACTOS (ExportableListBase)
  // ==========================================

  getFilteredData(): InternalExpense[] {
    return this.filteredExpenses();
  }

  getCurrentPageData(): InternalExpense[] {
    return this.currentPageExpenses();
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
   * Carga todos los gastos
   */
  loadExpenses(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.expensesService.getAllExpenses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.allExpenses.set(data);
          this.isLoading.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.error.set('Error al cargar gastos');
          // Error manejado por interceptor
        }
      });
  }

  /**
   * Recarga los gastos (para después de CRUD)
   */
  reloadExpenses(): void {
    this.loadExpenses();
  }

  // ==========================================
  // MÉTODOS DE FILTROS
  // ==========================================

  /**
   * Actualiza el término de búsqueda
   */
  updateSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  /**
   * Actualiza el filtro de categoría
   */
  updateCategoryFilter(category: string): void {
    this.selectedCategory.set(category);
  }

  /**
   * Actualiza el filtro de estado
   */
  updateStatusFilter(status: string): void {
    this.selectedStatus.set(status);
  }

  /**
   * Actualiza el filtro de deducible
   */
  updateDeductibleFilter(deductible: string): void {
    this.selectedDeductible.set(deductible);
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedCategory.set('');
    this.selectedStatus.set('');
    this.selectedDeductible.set('');

    // Sincronizar con formularios
    this.searchForm.patchValue({ searchTerm: '' }, { emitEvent: false });
    this.filtersForm.patchValue({
      selectedCategory: '',
      selectedStatus: '',
      selectedDeductible: ''
    }, { emitEvent: false });
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
    const info = this.paginationInfo();
    if (info.hasPrevious) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  /**
   * Navega a la página siguiente
   */
  nextPage(): void {
    const info = this.paginationInfo();
    if (info.hasNext) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  /**
   * Actualiza items por página
   */
  updateItemsPerPage(items: number): void {
    this.itemsPerPage.set(items);
  }

  /**
   * Obtiene las páginas visibles para la navegación
   */
  getVisiblePages(): number[] {
    return this.visiblePages();
  }

  /**
   * Obtiene el texto informativo de paginación
   */
  getPaginationText(): string {
    const info = this.paginationInfo();
    return `Mostrando ${info.startIndex} a ${info.endIndex} de ${info.totalItems} resultados`;
  }

  // ==========================================
  // MÉTODOS DE NAVEGACIÓN Y CRUD
  // ==========================================

  /**
   * Navega a la página de registro
   */
  createNewExpense(): void {
    this.router.navigate(['/dashboards/internal-expenses/register']);
  }

  /**
   * Navega a la página de edición
   */
  editExpense(id: number): void {
    this.router.navigate(['dashboards/internal-expenses/edit', id]);
  }

  /**
   * Elimina un gasto
   */
  deleteExpense(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Solo se pueden eliminar gastos pendientes',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.expensesService.deleteExpense(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              Swal.fire({
                title: 'Eliminado',
                text: 'El gasto se ha eliminado correctamente',
                icon: 'success',
                confirmButtonText: 'Ok'
              });
              this.reloadExpenses();
            },
            error: (e: HttpErrorResponse) => {
              // Error manejado por interceptor
            }
          });
      }
    });
  }

  // ==========================================
  // MÉTODOS DE WORKFLOW (Aprobar/Rechazar/Pagar)
  // ==========================================

  /**
   * Aprueba un gasto
   */
  approveExpense(id: number): void {
    Swal.fire({
      title: '¿Aprobar este gasto?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.expensesService.approveExpense(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              Swal.fire({
                title: 'Aprobado',
                text: 'El gasto se ha aprobado correctamente',
                icon: 'success',
                confirmButtonText: 'Ok'
              });
              this.reloadExpenses();
            },
            error: (e: HttpErrorResponse) => {
              // Error manejado por interceptor
            }
          });
      }
    });
  }

  /**
   * Rechaza un gasto
   */
  rejectExpense(id: number): void {
    Swal.fire({
      title: '¿Rechazar este gasto?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, rechazar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.expensesService.rejectExpense(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              Swal.fire({
                title: 'Rechazado',
                text: 'El gasto se ha rechazado',
                icon: 'info',
                confirmButtonText: 'Ok'
              });
              this.reloadExpenses();
            },
            error: (e: HttpErrorResponse) => {
              // Error manejado por interceptor
            }
          });
      }
    });
  }

  /**
   * Marca un gasto como pagado
   */
  markAsPaid(id: number): void {
    Swal.fire({
      title: '¿Marcar como pagado?',
      text: 'Solo se pueden pagar gastos aprobados',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar como pagado',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.expensesService.markExpenseAsPaid(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              Swal.fire({
                title: 'Pagado',
                text: 'El gasto se ha marcado como pagado',
                icon: 'success',
                confirmButtonText: 'Ok'
              });
              this.reloadExpenses();
            },
            error: (e: HttpErrorResponse) => {
              // Error manejado por interceptor
            }
          });
      }
    });
  }

  /**
   * Visualiza el archivo adjunto
   */
  viewAttachment(fileName: string): void {
    this.expensesService.downloadAttachment(fileName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
        },
        error: (e: HttpErrorResponse) => {
          Swal.fire({
            title: 'Error',
            text: 'No se pudo cargar el archivo',
            icon: 'error'
          });
        }
      });
  }

  // ==========================================
  // MÉTODOS AUXILIARES PARA EL RESUMEN
  // ==========================================

  /**
   * Obtiene el total de gastos pendientes
   */
  getPendingCount(): number {
    return this.pendingCount();
  }

  /**
   * Obtiene el total de gastos aprobados
   */
  getApprovedCount(): number {
    return this.approvedCount();
  }

  /**
   * Obtiene el total de gastos pagados
   */
  getPaidCount(): number {
    return this.paidCount();
  }

  /**
   * Obtiene el total de gastos rechazados
   */
  getRejectedCount(): number {
    return this.rejectedCount();
  }
}
