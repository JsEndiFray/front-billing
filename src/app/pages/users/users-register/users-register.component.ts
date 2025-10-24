import {Component, signal} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';

import Swal from 'sweetalert2';
import {Router} from '@angular/router';
import {AuthService} from '../../../core/services/auth-services/auth.service';
import {HttpErrorResponse} from '@angular/common/http';
import {User} from '../../../interfaces/users-interface';
import {ValidatorService} from '../../../core/services/validator-services/validator.service';

/**
 * Componente para registrar nuevos usuarios
 * Permite crear cuentas de usuario con validación
 */
@Component({
  selector: 'app-clients-user',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './users-register.component.html',
  styleUrl: './users-register.component.css'
})
export class UsersRegisterComponent {

  // ==========================================
  // PROPIEDADES DE FORMULARIOS MÚLTIPLES
  // ==========================================
  userForm: FormGroup;
  isSubmitting = signal(false);

  constructor(
    private router: Router,
    private authService: AuthService,
    private validatorService: ValidatorService,
    private fb: FormBuilder,
  ) {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      confirm_password: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]+$/)]],
      role: ['', Validators.required],
    })
  }

  /**
   * Registra un nuevo usuario en el sistema
   * Valida datos antes de enviar al servidor
   */
  registerUser() {
    if (!this.userForm.valid) {
      Swal.fire({
        title: 'Error!',
        text: 'Por favor, complete todos los campos requeridos',
        icon: 'error'
      });
      return;
    }

    // Aplica transformaciones automáticas al formulario de empleado:
    this.validatorService.applyTransformations(this.userForm, 'user');

    //Usar directamente los valores del FormGroup
    const userData = this.userForm.value;

    // Validar que todos los campos estén correctos
    const validation = this.validatorService.validateUser(userData);
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error!',
        text: validation.message,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    // Convertir rol de español a inglés para el backend
    const backendRoles = this.validatorService.transformRoleToBackend(userData.role);

    // Crear objeto con datos listos para enviar
    const newUser: User = {
      username: userData.username,
      password: userData.password,
      email: userData.email,
      phone: userData.phone,
      role: backendRoles
    }

    // Enviar datos al servidor para crear usuario
    this.authService.registerUser(newUser).subscribe({
      next: () => {
        Swal.fire({
          title: "Se ha registrado correctamente.",
          icon: "success",
          draggable: true
        });
        this.router.navigate(['/dashboards/users/list'])
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      },
    });
  };

  goBack() {
    this.router.navigate(['/dashboards/users/list'])
  }
}
