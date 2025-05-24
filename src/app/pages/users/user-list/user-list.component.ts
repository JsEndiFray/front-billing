import {Component, OnInit} from '@angular/core';
import {User, UsersArray} from '../../../interface/users-interface';
import {UserService} from '../../../core/services/user-services/user.service';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-user-list',
  imports: [
    DataFormatPipe
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {

//listado
  users: User[] = []


  constructor(
    private userService: UserService,
    private router: Router,
  ) {
  }

  ngOnInit(): void {
    this.getListUser();
    this.loadUsers();
  }

  //recargar la lista
  loadUsers() {
    this.userService.getAlltUser().subscribe({
      next: (response: UsersArray) => {
        this.users = response.data;
      }, error: (e: HttpErrorResponse) => {
      }
    })
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
            }).then(()=>{
              this.getListUser();
            });
          }, error: (e: HttpErrorResponse) => {
          }
        })
      }
    })

  };

//conexión DB
  //Listado de los usuarios
  getListUser() {
    this.userService.getAlltUser().subscribe({
      next: (result) => {
        this.users = result.data;
        console.log(this.users);
      }, error: (e: HttpErrorResponse) => {
      }
    })
  };


}
