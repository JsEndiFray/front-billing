import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth-services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
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

  login() {
    if (!this.userForm.valid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.authService.login(this.userForm.value).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: () => this.router.navigate(['/dashboards']),
      error: (e: HttpErrorResponse) => this.handleLoginError()
    });
  }

  private handleLoginError(): void {
    this.userForm.get('password')?.reset();
  }
}
