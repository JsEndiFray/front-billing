import {Component, DestroyRef, OnInit, computed, effect, inject, signal} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {EstatesOwners} from '../../../interfaces/estates-owners-interface';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import {EstateOwnersService} from '../../../core/services/entity-services/estate-owners.service';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {SearchService} from '../../../core/services/shared-services/search.service';
import {PaginationConfig} from '../../../interfaces/pagination-interface';
import {PaginationService} from '../../../core/services/shared-services/pagination.service';
import {ExportService} from '../../../core/services/shared-services/exportar.service';
import {ExportableListBase} from '../../../shared/Base/exportable-list.base';


/**
 * Componente para mostrar la lista de relaciones inmueble-propietario
 * Permite ver, editar y eliminar porcentajes de propiedad
 */
@Component({
  selector: 'app-estate-owners-list',
  imports: [
    DataFormatPipe,
    ReactiveFormsModule
  ],
  templateUrl: './estate-owners-list.component.html',
  styleUrl: './estate-owners-list.component.css'
})
export class EstateOwnersListComponent extends ExportableListBase<EstatesOwners> implements OnInit {

  private readonly estateOwnersService = inject(EstateOwnersService);
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);
  private readonly paginationService = inject(PaginationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly exportService = inject(ExportService);

  // ==========================================
  // FORMULARIOS
  // ==========================================

  readonly searchForm = this.fb.group({searchTerm: ['']});
  readonly paginationForm = this.fb.group({itemsPerPage: [5]});

  // ==========================================
  // SIGNALS DE FORMULARIO
  // ==========================================

  readonly searchTerm = toSignal(
    this.searchForm.controls.searchTerm.valueChanges,
    {initialValue: ''}
  );

  private readonly _itemsPerPage = toSignal(
    this.paginationForm.controls.itemsPerPage.valueChanges,
    {initialValue: 5}
  );

  // ==========================================
  // ESTADO REACTIVO
  // ==========================================

  private readonly allEstateOwners = signal<EstatesOwners[]>([]);
  readonly currentPage = signal(1);

  private readonly filteredEstateOwners = computed(() => {
    let filtered = [...this.allEstateOwners()];
    const searchTerm = this.searchTerm() ?? '';
    if (searchTerm) {
      filtered = this.searchService.filterData(
        filtered, searchTerm,
        ['owner_name', 'estate_name', 'ownership_percentage']
      );
    }
    return filtered;
  });

  readonly paginationInfo = computed(() => {
    const filtered = this.filteredEstateOwners();
    return this.paginationService.paginate(filtered, {
      currentPage: this.currentPage(),
      itemsPerPage: this._itemsPerPage() ?? 5,
      totalItems: filtered.length
    });
  });

  readonly visiblePages = computed(() =>
    this.paginationService.getVisiblePages(
      this.currentPage(),
      this.paginationInfo().totalPages,
      5
    )
  );

  readonly paginationText = computed(() =>
    this.paginationService.getPaginationText(
      {
        currentPage: this.currentPage(),
        itemsPerPage: this._itemsPerPage() ?? 5,
        totalItems: this.filteredEstateOwners().length
      },
      this.paginationInfo().items.length
    )
  );

  // ==========================================
  // EXPORTACIÓN (ExportableListBase)
  // ==========================================

  readonly entityName = 'porcentajes';
  readonly selectedItems = new Set<number>();

  readonly exportColumns = [
    {key: 'id', title: 'ID', width: 10},
    {key: 'estate_name', title: 'Propiedad', width: 30},
    {key: 'owner_name', title: 'Propietario', width: 30},
    {
      key: 'ownership_percentage',
      title: 'Porcentaje (%)',
      width: 15,
      formatter: (value: unknown) => value ? `${value}%` : '-'
    }
  ];

  constructor() {
    super();
    effect(() => {
      this.searchTerm();
      this.currentPage.set(1);
    }, {allowSignalWrites: true});
  }

  // ==========================================
  // MÉTODOS ABSTRACTOS (ExportableListBase)
  // ==========================================

  getFilteredData(): EstatesOwners[] {return this.filteredEstateOwners();}
  getCurrentPageData(): EstatesOwners[] {return this.paginationInfo().items;}
  getPaginationConfig(): PaginationConfig {
    return {
      currentPage: this.currentPage(),
      itemsPerPage: this._itemsPerPage() ?? 5,
      totalItems: this.filteredEstateOwners().length
    };
  }

  ngOnInit(): void {
    this.loadEstateOwners();
  }

  // ==========================================
  // CARGA DE DATOS
  // ==========================================

  loadEstateOwners() {
    this.estateOwnersService.getAllEstateOwners().subscribe({
      next: (data) => {
        this.allEstateOwners.set(data);
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  // ==========================================
  // FILTROS
  // ==========================================

  clearFilters() {
    this.searchForm.patchValue({searchTerm: ''});
  }

  // ==========================================
  // PAGINACIÓN
  // ==========================================

  goToPage(page: number) {
    if (this.paginationService.isValidPage(page, this.paginationInfo().totalPages)) {
      this.currentPage.set(page);
    }
  }

  previousPage() {
    if (this.paginationInfo().hasPrevious) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage() {
    if (this.paginationInfo().hasNext) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  // ==========================================
  // ACCIONES
  // ==========================================

  editEstateOwners(id: number) {
    this.router.navigate(['/dashboards/estates-owners/edit', id]);
  }

  deleteEstateOwners(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.estateOwnersService.deleteEstateOwners(id).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado.',
              text: 'El porcentage de la propriedad fue eliminado correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
            this.loadEstateOwners();
          },
          error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        });
      }
    });
  }

  newEstateOwner() {
    this.router.navigate(['/dashboards/estates/register']);
  }
}
