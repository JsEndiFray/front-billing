import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {User, UserEdit} from '../../../interface/users-interface';
import {UserService} from '../../../core/services/user-services/user.service';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';
import {UserValidatorService} from '../../../core/services/validator-services/user-validator.service';

@Component({
  selector: 'app-user-edit',
  imports: [
    FormsModule
  ],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.css'
})
export class UserEditComponent implements OnInit {


  user: User = {
    username: '',
    password: '',
    confirm_password: '',
    email: '',
    phone: '',
    role: '',
  }

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private userValidatorService: UserValidatorService,
  ) {
  }

  ngOnInit(): void {
    // Obtener el ID de la URL
    this.route.params.subscribe(params => {
      const id = params['id'];// Convertir a número
      if (id) {
        // Cargo los campos del usuario
        this.userService.getById(id).subscribe({
          next: (response: UserEdit) => {
            // Verificar la estructura y extraer los datos
            if (response && response.data) {
              // Si viene dentro de data.result
              this.user = response.data;
            }
          },
          error: (e: HttpErrorResponse) => {
          }
        })
      }
    })
  }


  //actualizar usuarios
  updateUser() {
    //verifica id
    if (this.user.id == null) {
      Swal.fire({
        title: 'Error',
        text: 'ID de usuario no válido.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }
    //Limpiar y transformar datos
    const cleanUser = this.userValidatorService.cleanUserData(this.user)

    // Validar campos requeridos y confirmacion de contraseñas
    const validation = this.userValidatorService.validateUser(cleanUser)
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error!',
        text: validation.message,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }
    //acceso al backemd
    this.userService.updateUser(this.user.id, this.user).subscribe({
      next: (data) => {
        this.user = data;
        Swal.fire({
          title: '¡Éxito!',
          text: 'Usuario actualizado correctamente.',
          icon: 'success',
          confirmButtonText: 'Ok'
        });
        this.router.navigate(['/dashboard/users/list']);
      }, error: (e: HttpErrorResponse) => {

      }
    })


  }


}
