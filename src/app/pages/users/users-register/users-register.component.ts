import {Component, inject, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {finalize} from 'rxjs';

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

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly validatorService = inject(ValidatorService);
  private readonly fb = inject(FormBuilder);

  readonly userForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    confirm_password: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]+$/)]],
    role: ['', Validators.required],
  });

  readonly isSubmitting = signal(false);

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
    const userData = this.userForm.getRawValue();
    const userDataClean = {
      username:         userData.username         ?? '',
      password:         userData.password         ?? '',
      confirm_password: userData.confirm_password ?? '',
      email:            userData.email            ?? '',
      phone:            userData.phone            ?? '',
      role:             userData.role             ?? ''
    };

    // Validar que todos los campos estén correctos
    const validation = this.validatorService.validateUser(userDataClean);
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
    const backendRoles = this.validatorService.transformRoleToBackend(userDataClean.role);

    // Crear objeto con datos listos para enviar
    const newUser: User = {
      username: userDataClean.username,
      password: userDataClean.password,
      email:    userDataClean.email,
      phone:    userDataClean.phone,
      role:     backendRoles
    };

    this.isSubmitting.set(true);
    this.authService.registerUser(newUser).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: () => {
        Swal.fire({
          title: "Se ha registrado correctamente.",
          icon: "success",
          draggable: true
        });
        this.router.navigate(['/dashboards/users/list']);
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      },
    });
  }

  goBack() {
    this.router.navigate(['/dashboards/users/list']);
  }
}
