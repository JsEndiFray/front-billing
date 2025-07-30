import {Component, OnInit} from '@angular/core';
import {User} from '../../../interface/users-interface';
import {UserService} from '../../../core/services/user-services/user.service';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import Swal from 'sweetalert2';
import {SearchService} from '../../../core/services/search-services/search.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

/**
 * Componente para mostrar y gestionar la lista de usuarios
 * Permite buscar, editar y eliminar usuarios
 */
@Component({
  selector: 'app-user-list',
  imports: [
    DataFormatPipe,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {

  // Lista de usuarios que se muestra en la tabla
  users: User[] = []

  // Lista completa de usuarios (datos originales sin filtrar)
  allUsers: User[] = [];

  // Texto que escribe el usuario para buscar
  searchTerm: string = '';

  constructor(
    private userService: UserService,
    private router: Router,
    private searchService: SearchService,
  ) {
  }

  /**
   * Se ejecuta al cargar el componente
   * Carga la lista de usuarios automáticamente
   */
  ngOnInit(): void {
    this.getListUser();
  }

  /**
   * Obtiene todos los usuarios del servidor
   * Guarda una copia original para los filtros de búsqueda
   */
  getListUser() {
    this.userService.getUser().subscribe({
      next: (user) => {
        this.users = user;        // Lista que se muestra
        this.allUsers = user;     // Copia original para filtros
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  };

  /**
   * Filtra la lista de usuarios según el texto de búsqueda
   * Busca en: username, email, phone y role
   */
  filterUser() {
    this.users = this.searchService.filterData(
      this.allUsers,
      this.searchTerm,
      ['username', "email", "phone", "role"]
    )
  };

  /**
   * Limpia el filtro de búsqueda y muestra todos los usuarios
   */
  clearSearch() {
    this.searchTerm = '';
    this.filterUser();
  }

  /**
   * Se ejecuta cada vez que el usuario escribe en el buscador
   */
  onSearchChange() {
    this.filterUser();
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
}
