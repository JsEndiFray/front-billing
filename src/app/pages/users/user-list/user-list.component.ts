import {Component, OnInit} from '@angular/core';
import {User} from '../../../interface/users-interface';
import {UserService} from '../../../core/services/user-services/user.service';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import Swal from 'sweetalert2';
import {SearchService} from '../../../core/services/search-services/search.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';


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

//listado de usuarios
  users: User[] = []

// Lista completa de clientes (datos originales)
  allUsers: User[] = [];

  // Término de búsqueda
  searchTerm: string = '';

  constructor(
    private userService: UserService,
    private router: Router,
    private searchService: SearchService,
  ) {
  }

  ngOnInit(): void {
    this.getListUser();
  }

  //Listado de los usuarios
  getListUser() {
    this.userService.getUser().subscribe({
      next: (user) => {
        this.users = user;
        this.allUsers = user;
      }, error: (e: HttpErrorResponse) => {
      }
    })
  };

  //método de flitros
  filterUser() {
    this.users = this.searchService.filterData(
      this.allUsers,
      this.searchTerm,
      ['username', "email", "phone", "role"]
    )
  };

  //Limpiar el término de búsqueda y mostrar todos los clientes
  clearSearch() {
    this.searchTerm = '';
    this.filterUser();
  }

  onSearchChange() {
    this.filterUser();
  }

//ruta para editar (boton)
  editUser(id: number) {
    this.router.navigate(['/dashboard/users/edit', id]);

  };

//ruta para eliminar (boton)
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
        this.userService.deleteUser(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado.',
              text: 'Usuario eliminado correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            }).then(() => {
              this.getListUser();
            });
          }, error: (e: HttpErrorResponse) => {
          }
        })
      }
    })

  };


}
