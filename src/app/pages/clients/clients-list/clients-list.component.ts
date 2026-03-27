import {Component, DestroyRef, OnInit, computed, effect, inject, signal} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {Clients} from '../../../interfaces/clientes-interface';
import {ClientsService} from '../../../core/services/entity-services/clients.service';
import {HttpErrorResponse} from '@angular/common/http';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import Swal from 'sweetalert2';
import {Router} from '@angular/router';
import {SearchService} from '../../../core/services/shared-services/search.service';
import {PaginationConfig} from '../../../interfaces/pagination-interface';
import {PaginationService} from '../../../core/services/shared-services/pagination.service';
import {CLIENT_TYPES_LABELS} from '../../../shared/Collection-Enum/collection-enum';
import {ExportService} from '../../../core/services/shared-services/exportar.service';
import {ExportableListBase} from '../../../shared/Base/exportable-list.base';

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
export class ClientsListComponent extends ExportableListBase<Clients> implements OnInit {

  private readonly router = inject(Router);
  private readonly clientsService = inject(ClientsService);
  private readonly searchService = inject(SearchService);
  private readonly paginationService = inject(PaginationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly exportService = inject(ExportService);

  // ==========================================
  // FORMULARIOS
  // ==========================================

  readonly searchForm = this.fb.group({searchTerm: ['']});
  readonly filtersForm = this.fb.group({selectedType: [''], selectedProvince: ['']});
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

  private readonly allClients = signal<Clients[]>([]);
  readonly currentPage = signal(1);

  readonly provinceOptions = computed(() =>
    this.allClients()
      .map(c => c.province)
      .filter((p, i, arr): p is string => !!p && arr.indexOf(p) === i)
      .sort()
  );

  private readonly filteredClients = computed(() => {
    let filtered = [...this.allClients()];
    const searchTerm = this.searchTerm() ?? '';
    const selectedType = this._filtersValue().selectedType ?? '';
    const selectedProvince = this._filtersValue().selectedProvince ?? '';

    if (searchTerm.trim()) {
      filtered = this.searchService.filterWithFullName(
        filtered, searchTerm, 'name', 'lastname',
        ['identification', 'phone', 'company_name', 'email']
      );
    }
    if (selectedType) {
      filtered = filtered.filter(c => c.type_client === selectedType);
    }
    if (selectedProvince) {
      filtered = filtered.filter(c => c.province === selectedProvince);
    }
    return filtered;
  });

  readonly paginationInfo = computed(() => {
    const filtered = this.filteredClients();
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
        totalItems: this.filteredClients().length
      },
      this.paginationInfo().items.length
    )
  );

  // ==========================================
  // EXPORTACIÓN (ExportableListBase)
  // ==========================================

  readonly entityName = 'clientes';
  readonly selectedItems = new Set<number>();

  readonly exportColumns = [
    {key: 'id', title: 'ID', width: 10},
    {key: 'type_client', title: 'Tipo', width: 15},
    {key: 'name', title: 'Nombre', width: 20},
    {key: 'lastname', title: 'Apellidos', width: 20},
    {key: 'company_name', title: 'Empresa', width: 25},
    {key: 'identification', title: 'Identificación', width: 15},
    {key: 'email', title: 'Email', width: 25},
    {key: 'phone', title: 'Teléfono', width: 15},
    {key: 'location', title: 'Localidad', width: 20},
    {key: 'province', title: 'Provincia', width: 20}
  ];

  readonly clientTypeLabels = CLIENT_TYPES_LABELS;

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

  getFilteredData(): Clients[] {return this.filteredClients();}
  getCurrentPageData(): Clients[] {return this.paginationInfo().items;}
  getPaginationConfig(): PaginationConfig {
    return {
      currentPage: this.currentPage(),
      itemsPerPage: this._itemsPerPage() ?? 5,
      totalItems: this.filteredClients().length
    };
  }

  ngOnInit(): void {
    this.loadClients();
  }

  // ==========================================
  // CARGA DE DATOS
  // ==========================================

  loadClients() {
    this.clientsService.getClients().subscribe({
      next: (clientList) => {
        this.allClients.set(clientList);
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
    this.filtersForm.patchValue({selectedType: '', selectedProvince: ''});
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

  editClient(id: number) {
    this.router.navigate(['/dashboards/clients/edit', id]);
  }

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
        this.clientsService.deleleteUser(id).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado.',
              text: 'Cliente eliminado correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
            this.loadClients();
          },
          error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        });
      }
    });
  }

  newClient() {
    this.router.navigate(['/dashboards/clients/register']);
  }
}
