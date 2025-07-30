import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {User} from '../../../interface/users-interface';
import {UserService} from '../../../core/services/user-services/user.service';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';
import {UserValidatorService} from '../../../core/services/validator-services/user-validator.service';

/**
 * Componente para editar usuarios existentes
 * Carga los datos del usuario y permite modificarlos
 */
@Component({
  selector: 'app-user-edit',
  imports: [
    FormsModule
  ],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.css'
})
export class UserEditComponent implements OnInit {

  // Objeto que guarda todos los datos del usuario
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

  /**
   * Se ejecuta al cargar el componente
   * Busca el usuario que se quiere editar
   */
  ngOnInit(): void {
    // Sacar el ID de la URL (ejemplo: /edit/123)
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        // Buscar los datos del usuario por su ID
        this.userService.getById(id).subscribe({
          next: (data) => {
            if (data && data.length > 0) {
              this.user = data[0];
            }
          },
          error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        })
      }
    })
  }

  /**
   * Actualiza los datos del usuario
   * Valida información antes de enviar al servidor
   */
  updateUser() {
    // Verificar que el usuario tenga ID válido
    if (this.user.id == null) {
      Swal.fire({
        title: 'Error',
        text: 'ID de usuario no válido.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    // Limpiar espacios y preparar datos
    const cleanUser = this.userValidatorService.cleanUserData(this.user)

    // Validar que todos los campos estén correctos
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

    // Enviar datos actualizados al servidor
    this.userService.updateUser(this.user.id, cleanUser).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.user = data[0];
          Swal.fire({
            title: '¡Éxito!',
            text: 'Usuario actualizado correctamente.',
            icon: 'success',
            confirmButtonText: 'Ok'
          });
        }
        // Regresar a la lista de usuarios
        this.router.navigate(['/dashboards/users/list']);
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  }

  /**
   * Cancelar edición y regresar a la lista
   */
  goBack() {
    this.router.navigate(['/dashboards/users/list']);
  };
}
