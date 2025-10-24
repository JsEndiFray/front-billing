import {Component, signal} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from '../../../core/services/auth-services/auth.service';
import {HttpErrorResponse} from '@angular/common/http';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
/**
 * Componente de autenticación
 * Maneja login de usuarios y redirección a dashboards
 */

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  userForm: FormGroup;
  isSubmitting = signal(false);

  constructor(
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

  }

  /**
   * Procesa login con validación básica
   * Nota: AuthService maneja el guardado de tokens automáticamente
   */
  login() {
    if (!this.userForm.valid) {
      this.userForm.markAllAsTouched();
      return;
    }
    // Preparar datos para backend
    this.isSubmitting.set(true);
    const userData = this.userForm.value;

    // Autenticar usuario
    this.authService.login(userData).subscribe({
      next: (login) => {
        this.router.navigate(['/dashboards']);
      },
      error: (e: HttpErrorResponse) => {
        // Manejo de errores por interceptor
      }
    });
  }
}

