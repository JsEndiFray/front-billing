import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {UserService} from '../../../core/services/entity-services/user.service';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';
import {ValidatorService} from '../../../core/services/validator-services/validator.service';

/**
 * Componente para editar usuarios existentes
 * Carga los datos del usuario y permite modificarlos
 */
@Component({
  selector: 'app-user-edit',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.css'
})
export class UserEditComponent implements OnInit {

  // ==========================================
  // PROPIEDADES DE FORMULARIOS MÚLTIPLES
  // ==========================================
  userForm: FormGroup;

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private validatorService: ValidatorService,
    private fb: FormBuilder,
  ) {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      confirm_password: ['', Validators.required],
      email: ['', Validators.required],
      phone: ['', Validators.required],
      role: ['', Validators.required],
    })
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
              const user = data[0];
              this.userForm.patchValue({
                username: user.username,
                password: user.password,
                confirm_password: user.password,
                email: user.email,
                phone: user.phone,
                role: user.role
              })
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
    // Verificar que el formulario sea válido
    if (!this.userForm.valid) {
      Swal.fire({
        title: 'Error!',
        text: 'Por favor, complete todos los campos requeridos',
        icon: 'error'
      });
      return;
    }
    // Aplica transformaciones automáticas al formulario de usuarios:
    this.validatorService.applyTransformations(this.userForm, 'user');

    // Obtener datos del formulario
    const userData = this.userForm.value;

    // Validar que todos los campos estén correctos
    const validation = this.validatorService.validateUser(userData);
    if (!validation.isValid) {
      this.userForm.markAllAsTouched();
      Swal.fire({
        title: 'Error!',
        text: validation.message,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    //Usar la id de la ruta, no de una propiedad inexistente
    const userId = this.route.snapshot.params['id'];
    if (!userId) {
      Swal.fire({
        title: 'Error',
        text: 'ID del usuario no es válido',
        icon: 'error'
      });
      return;
    }
    // Enviar datos actualizados al servidor
    this.userService.updateUser(userId, userData).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Usuario actualizado correctamente.',
          icon: 'success',
          confirmButtonText: 'Ok'
        });
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
