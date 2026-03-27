import {Component, DestroyRef, OnInit, computed, effect, inject, signal} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {Estates} from '../../../interfaces/estates-interface';
import {EstatesService} from '../../../core/services/entity-services/estates.service';
import {HttpErrorResponse} from '@angular/common/http';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import Swal from 'sweetalert2';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import {SearchService} from '../../../core/services/shared-services/search.service';
import {PaginationConfig} from '../../../interfaces/pagination-interface';
import {PaginationService} from '../../../core/services/shared-services/pagination.service';
import {ExportService} from '../../../core/services/shared-services/exportar.service';
import {ExportableListBase} from '../../../shared/Base/exportable-list.base';

/**
 * Componente para mostrar y gestionar la lista de propiedades inmobiliarias
 * Permite buscar, editar y eliminar inmuebles
 */
@Component({
  selector: 'app-estates-list',
  standalone: true,
  imports: [
    DataFormatPipe,
    ReactiveFormsModule
  ],
  templateUrl: './estates-list.component.html',
  styleUrl: './estates-list.component.css'
})
export class EstatesListComponent extends ExportableListBase<Estates> implements OnInit {

  private readonly estateService = inject(EstatesService);
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
  readonly filtersForm = this.fb.group({selectedProvince: ['']});
  readonly paginationForm = this.fb.group({itemsPerPage: [5]});

  // ==========================================
  // SIGNALS DE FORMULARIO
  // ==========================================

  readonly searchTerm = toSignal(
    this.searchForm.controls.searchTerm.valueChanges,
    {initialValue: ''}
  );

  private readonly _filtersValue = toSignal(
    this.filtersForm.valueChanges,
    {initialValue: this.filtersForm.value}
  );

  private readonly _itemsPerPage = toSignal(
    this.paginationForm.controls.itemsPerPage.valueChanges,
    {initialValue: 5}
  );

  // ==========================================
  // ESTADO REACTIVO
  // ==========================================

  private readonly allEstates = signal<Estates[]>([]);
  readonly currentPage = signal(1);

  readonly provinceOptions = computed(() =>
    this.allEstates()
      .map(e => e.province)
      .filter((p, i, arr): p is string => !!p && arr.indexOf(p) === i)
      .sort()
  );

  private readonly filteredEstates = computed(() => {
    let filtered = [...this.allEstates()];
    const searchTerm = this.searchTerm() ?? '';
    const selectedProvince = this._filtersValue().selectedProvince ?? '';

    if (searchTerm) {
      filtered = this.searchService.filterData(
        filtered, searchTerm,
        ['cadastral_reference', 'address', 'location', 'province']
      );
    }
    if (selectedProvince) {
      filtered = filtered.filter(e => e.province === selectedProvince);
    }
    return filtered;
  });

  readonly paginationInfo = computed(() => {
    const filtered = this.filteredEstates();
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
        totalItems: this.filteredEstates().length
      },
      this.paginationInfo().items.length
    )
  );

  // ==========================================
  // EXPORTACIÓN (ExportableListBase)
  // ==========================================

  readonly entityName = 'propiedades';
  readonly selectedItems = new Set<number>();

  readonly exportColumns = [
    {key: 'id', title: 'ID', width: 10},
    {key: 'cadastral_reference', title: 'Ref. Catastral', width: 20},
    {key: 'price', title: 'Precio (€)', width: 15, formatter: (value: unknown) => value ? `${value} €` : '-'},
    {key: 'address', title: 'Dirección', width: 30},
    {key: 'postal_code', title: 'C.P.', width: 10},
    {key: 'location', title: 'Localidad', width: 20},
    {key: 'province', title: 'Provincia', width: 20},
    {key: 'country', title: 'País', width: 15},
    {key: 'surface', title: 'Superficie (m²)', width: 15, formatter: (value: unknown) => value ? `${value} m²` : '-'}
  ];

  constructor() {
    super();
    effect(() => {
      this.searchTerm();
      this._filtersValue();
      this.currentPage.set(1);
    }, {allowSignalWrites: true});
  }

  // ==========================================
  // MÉTODOS ABSTRACTOS (ExportableListBase)
  // ==========================================

  getFilteredData(): Estates[] {return this.filteredEstates();}
  getCurrentPageData(): Estates[] {return this.paginationInfo().items;}
  getPaginationConfig(): PaginationConfig {
    return {
      currentPage: this.currentPage(),
      itemsPerPage: this._itemsPerPage() ?? 5,
      totalItems: this.filteredEstates().length
    };
  }

  ngOnInit(): void {
    this.loadEstates();
  }

  // ==========================================
  // CARGA DE DATOS
  // ==========================================

  loadEstates() {
    this.estateService.getAllEstate().subscribe({
      next: (estatesList) => {
        this.allEstates.set(estatesList);
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
    this.filtersForm.patchValue({selectedProvince: ''});
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

  editEstate(id: number) {
    this.router.navigate(['/dashboards/estates/edit', id]);
  }

  deleteEstate(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.estateService.deleteEstate(id).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado.',
              text: 'Inmueble eliminado correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
            this.loadEstates();
          },
          error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        });
      }
    });
  }

  newEstate() {
    this.router.navigate(['/dashboards/estates/register']);
  }
}
