import {Component, OnInit} from '@angular/core';
import {User} from '../../../interfaces/users-interface';
import {UserService} from '../../../core/services/user-services/user.service';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import Swal from 'sweetalert2';
import {SearchService} from '../../../core/services/shared-services/search.service';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {PaginationConfig, PaginationResult} from '../../../interfaces/pagination-interface';
import {PaginationService} from '../../../core/services/shared-services/pagination.service';

/**
 * Componente para mostrar y gestionar la lista de usuarios
 * Permite buscar, editar y eliminar usuarios
 */
@Component({
  selector: 'app-user-list',
  imports: [
    DataFormatPipe,
    ReactiveFormsModule,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {

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

  // Lista de usuarios que se muestra en la tabla
  users: User[] = []

  // Lista completa de usuarios (datos originales sin filtrar)
  allUsers: User[] = [];

  //lista de filtro de usuarios
  filteredUser: User[] = [];

  userOptions: string[] = [];

  // Configuración de paginación
  paginationConfig: PaginationConfig = {
    currentPage: 1,
    itemsPerPage: 3,
    totalItems: 0
  };

  // Resultado de paginación
  paginationResult: PaginationResult<User> = {
    items: [],
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
    startIndex: 0,
    endIndex: 0
  };


  constructor(
    private userService: UserService,
    private router: Router,
    private searchService: SearchService,
    private paginationService: PaginationService,
    private fb: FormBuilder,
  ) {
    // FormGroup para búsqueda
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });

    // FormGroup para filtros
    this.filtersForm = this.fb.group({
      selectUser: ['']
    });

    // FormGroup para paginación
    this.paginationForm = this.fb.group({
      itemsPerPage: [5]
    });
  }

  /**
   * Se ejecuta al cargar el componente
   * Carga la lista de usuarios automáticamente
   */
  ngOnInit(): void {
    this.getListUser();
    this.setupFormSubscriptions();
  };

  // ==========================================
  // MÉTODOS DE CONFIGURACIÓN
  // ==========================================

  setupFormSubscriptions() {
    this.searchForm.get('searchTerm')?.valueChanges.subscribe(() => {
      this.applyFilters();
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

  /**
   * Obtiene todos los usuarios del servidor
   * Guarda una copia original para los filtros de búsqueda
   */
  getListUser() {
    this.userService.getUser().subscribe({
      next: (user) => {
        this.allUsers = user;
        this.applyFilters();
        this.extractUserOptions();
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  };

  // ==========================================
  // MÉTODOS DE FILTROS Y BÚSQUEDA
  // ==========================================

  extractUserOptions() {
    //muestra todos los usuarios
    const users = this.allUsers
      .map(user => user.username)
      //elimina duplicados y valores vacios
      .filter((user, index, array) => user && array.indexOf(user) === index)
      //ordena alfabéticamente
      .sort();

    this.userOptions = users;
  }

  /**
   * Limpia el filtro de búsqueda
   */
  clearFilters() {
    this.searchForm.patchValue({
      searchTerm: ''
    });
    this.filtersForm.patchValue({
      selectUser: ''
    })
  }

  /**
   * Filtra la lista de empleados según el texto de búsqueda
   * Busca en: nombre completo, identificación y teléfono
   */
  applyFilters() {
    let filtered = [...this.allUsers];

    // Obtener valores directamente de cada FormGroup independiente
    const searchTerm = this.searchForm.get('searchTerm')?.value;
    const selectUser = this.filtersForm.get('selectUser')?.value;

    // Filtro por búsqueda de texto
    if (searchTerm) {
      filtered = this.searchService.filterData(
        filtered,
        searchTerm,
        ['username', "email", "phone", "role"]
      );
    }

    if (selectUser) {
      filtered = filtered.filter(users => users.username === selectUser);
    }

    this.filteredUser = filtered;
    this.paginationConfig.totalItems = filtered.length;
    this.paginationConfig.currentPage = 1 // Resetear a primera página
    this.updatePagination();
  };


  // ==========================================
  // MÉTODOS DE PAGINACIÓN
  // ==========================================

  /**
   * Actualiza la paginación con los datos filtrados
   */
  updatePagination() {
    this.paginationResult = this.paginationService.paginate(
      this.filteredUser,
      this.paginationConfig
    );
    this.users = this.paginationResult.items;
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
      this.users.length
    );
  }


  /**
   * Navega a la página de edición de usuario
   */
  editUser(id: number) {
    this.router.navigate(['/dashboards/users/edit', id]);
  };

  /**
   * Elimina un usuario después de confirmar la acción
   * Muestra mensaje de confirmación antes de eliminar
   */
  deleteUser(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Usuario confirmó, proceder a eliminar
        this.userService.deleteUser(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado.',
              text: 'Usuario eliminado correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            }).then(() => {
              // Recargar la lista para mostrar cambios
              this.getListUser();
            });
          }, error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        })
      }
    })
  };

  newUser() {
    this.router.navigate(['/dashboards/users/register'])
  }

  exportData(){}
}
