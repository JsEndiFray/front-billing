import {Component, OnInit} from '@angular/core';
import {SuppliersService} from '../../../../core/services/entity-services/suppliers.service';
import {Router} from '@angular/router';
import {SearchService} from '../../../../core/services/shared-services/search.service';
import {PaginationService} from '../../../../core/services/shared-services/pagination.service';
import {ExportService} from '../../../../core/services/shared-services/exportar.service';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Suppliers} from '../../../../interfaces/suppliers-interface';
import {ACTIVE_STATUS_LABELS, PAYMENT_TERMS_LABELS} from '../../../../shared/Collection-Enum/collection-enum';
import {PaginationConfig, PaginationResult} from '../../../../interfaces/pagination-interface';
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
  // PROPIEDADES DE FORMULARIOS
  // ==========================================
  searchForm: FormGroup;
  filtersForm: FormGroup;
  paginationForm: FormGroup;

  // ==========================================
  // PROPIEDADES DE DATOS
  // ==========================================
  suppliers: Suppliers[] = [];
  allSuppliers: Suppliers[] = [];
  filteredSuppliers: Suppliers[] = [];

  // ==========================================
  // LABELS (enums importados)
  // ==========================================
  activeStatusLabels = ACTIVE_STATUS_LABELS;
  paymentTermsLabels = PAYMENT_TERMS_LABELS;

  // ==========================================
  // PAGINACIÓN
  // ==========================================
  paginationConfig: PaginationConfig = {
    currentPage: 1,
    itemsPerPage: 5,
    totalItems: 0
  };

  paginationResult: PaginationResult<Suppliers> = {
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
  entityName = 'proveedores'; //para nombrar los documentos descargados
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


  constructor(
    private suppliersService: SuppliersService,
    private router: Router,
    private searchService: SearchService,
    private paginationService: PaginationService,
    public exportService: ExportService,
    private fb: FormBuilder
  ) {
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
  };

  // Implementar métodos abstractos
  getFilteredData(): Suppliers[] {
    return this.filteredSuppliers;
  }

  getCurrentPageData(): Suppliers[] {
    return this.suppliers;
  }

  getPaginationConfig(): PaginationConfig {
    return this.paginationConfig;
  }


  ngOnInit(): void {
    this.getListSuppliers();
    this.setupFormSubscriptions();
  }

  // ==========================================
  // MÉTODOS DE CONFIGURACIÓN
  // ==========================================

  /**
   * Configura las suscripciones reactivas
   */
  setupFormSubscriptions(): void {
    // Búsqueda en tiempo real
    this.searchForm.get('searchTerm')?.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    // Filtros en tiempo real
    this.filtersForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    // Cambios en paginación
    this.paginationForm.get('itemsPerPage')?.valueChanges.subscribe((items) => {
      this.paginationConfig.itemsPerPage = items;
      this.paginationConfig.currentPage = 1;
      this.updatePagination();
    });
  }

  // ==========================================
  // MÉTODOS DE CARGA DE DATOS
  // ==========================================

  /**
   * Obtiene todos los proveedores del servidor
   */
  getListSuppliers(): void {
    this.suppliersService.getAllSuppliersIncludingInactive().subscribe({
      next: (suppliersList) => {
        this.allSuppliers = suppliersList;
        this.applyFilters();
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  };

  // ==========================================
  // MÉTODOS DE FILTROS Y BÚSQUEDA
  // ==========================================

  /**
   * Aplica todos los filtros activos
   */
  applyFilters(): void {
    let filtered = [...this.allSuppliers];

    const search = this.searchForm.get('searchTerm')?.value;
    const activeStatus = this.filtersForm.get('selectedActiveStatus')?.value;
    const paymentTerms = this.filtersForm.get('selectedPaymentTerms')?.value;

    // Filtro por búsqueda de texto
    if (search?.trim()) {
      filtered = this.searchService.filterData(
        filtered,
        search,
        ['name', 'company_name', 'tax_id', 'email', 'city', 'contact_person']
      );
    }

    // Filtro por estado activo/inactivo
    if (activeStatus !== '') {
      const isActive = activeStatus === 'true';
      filtered = filtered.filter(supplier => supplier.active === isActive);
    }

    // Filtro por términos de pago
    if (paymentTerms !== '') {
      filtered = filtered.filter(supplier =>
        supplier.payment_terms === Number(paymentTerms)
      );
    }

    this.filteredSuppliers = filtered;
    this.paginationConfig.totalItems = filtered.length;
    this.paginationConfig.currentPage = 1;
    this.updatePagination();
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.searchForm.patchValue({
      searchTerm: ''
    });

    this.filtersForm.patchValue({
      selectedActiveStatus: '',
      selectedPaymentTerms: ''
    });
  }

  // ==========================================
  // MÉTODOS DE PAGINACIÓN
  // ==========================================

  /**
   * Actualiza la paginación con los datos filtrados
   */
  updatePagination(): void {
    this.paginationResult = this.paginationService.paginate(
      this.filteredSuppliers,
      this.paginationConfig
    );
    this.suppliers = this.paginationResult.items;
  }

  /**
   * Navega a una página específica
   */
  goToPage(page: number): void {
    if (this.paginationService.isValidPage(page, this.paginationResult.totalPages)) {
      this.paginationConfig.currentPage = page;
      this.updatePagination();
    }
  }

  /**
   * Navega a la página anterior
   */
  previousPage(): void {
    if (this.paginationResult.hasPrevious) {
      this.goToPage(this.paginationConfig.currentPage - 1);
    }
  }

  /**
   * Navega a la página siguiente
   */
  nextPage(): void {
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
      this.suppliers.length
    );
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
   * Elimina un proveedor (borrado lógico)
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
        this.suppliersService.deleteSupplier(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Desactivado',
              text: 'El proveedor se ha desactivado correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
            this.getListSuppliers();
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
        this.suppliersService.activateSupplier(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Reactivado',
              text: 'El proveedor se ha reactivado correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
            this.getListSuppliers();
          },
          error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        });
      }
    });
  };

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
