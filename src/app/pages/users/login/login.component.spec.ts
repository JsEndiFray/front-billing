import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth-services/auth.service';
import { LoginResponse } from '../../../interfaces/users-interface';

const mockLoginResponse: LoginResponse = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  user: { id: 1, username: 'testuser', password: '', email: 'test@test.com', phone: '600000000', role: 'admin' }
};

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login']);
    routerSpy     = jasmine.createSpyObj<Router>('Router', ['navigate']);
    routerSpy.navigate.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports:   [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router,      useValue: routerSpy }
      ]
    }).compileComponents();

    fixture   = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─── Validación del formulario ────────────────────────────────────────────

  describe('form validation', () => {
    it('should NOT call AuthService.login when the form is empty/invalid', () => {
      component.login();
      expect(authServiceSpy.login).not.toHaveBeenCalled();
    });

    it('should mark all controls as touched on invalid submit so errors are visible', () => {
      component.login();
      expect(component.userForm.get('username')?.touched).toBeTrue();
      expect(component.userForm.get('password')?.touched).toBeTrue();
    });
  });

  // ─── Estado de carga (isSubmitting) ──────────────────────────────────────

  describe('isSubmitting state', () => {
    it('should set isSubmitting to TRUE while the HTTP request is pending', () => {
      // Subject never emits → simulates a request in-flight
      const pending$ = new Subject<LoginResponse>();
      authServiceSpy.login.and.returnValue(pending$.asObservable());

      component.userForm.setValue({ username: 'user', password: 'pass' });
      component.login();

      expect(component.isSubmitting()).toBeTrue();

      pending$.complete(); // cleanup
    });

    it('should reset isSubmitting to FALSE after a SUCCESSFUL login (via finalize)', fakeAsync(() => {
      authServiceSpy.login.and.returnValue(of(mockLoginResponse));

      component.userForm.setValue({ username: 'user', password: 'pass' });
      component.login();
      tick();

      expect(component.isSubmitting()).toBeFalse();
    }));

    it('should reset isSubmitting to FALSE after a FAILED login (via finalize)', fakeAsync(() => {
      const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      authServiceSpy.login.and.returnValue(throwError(() => error));

      component.userForm.setValue({ username: 'user', password: 'pass' });
      component.login();
      tick();

      expect(component.isSubmitting()).toBeFalse();
    }));
  });

  // ─── Flujo de éxito ───────────────────────────────────────────────────────

  describe('success flow', () => {
    it('should navigate to /dashboards after a successful login', fakeAsync(() => {
      authServiceSpy.login.and.returnValue(of(mockLoginResponse));

      component.userForm.setValue({ username: 'user', password: 'pass' });
      component.login();
      tick();

      expect(routerSpy.navigate).toHaveBeenCalledOnceWith(['/dashboards']);
    }));
  });

  // ─── Flujo de error ───────────────────────────────────────────────────────

  describe('error flow', () => {
    it('should clear the password field after a failed login', fakeAsync(() => {
      const error = new HttpErrorResponse({ status: 401 });
      authServiceSpy.login.and.returnValue(throwError(() => error));

      component.userForm.setValue({ username: 'user', password: 'secret123' });
      component.login();
      tick();

      // reset() sets the value to null and clears dirty/touched state
      expect(component.userForm.get('password')?.value).toBeNull();
    }));

    it('should preserve the username field after a failed login', fakeAsync(() => {
      const error = new HttpErrorResponse({ status: 401 });
      authServiceSpy.login.and.returnValue(throwError(() => error));

      component.userForm.setValue({ username: 'myuser', password: 'secret123' });
      component.login();
      tick();

      expect(component.userForm.get('username')?.value).toBe('myuser');
    }));

    it('should NOT navigate after a failed login', fakeAsync(() => {
      const error = new HttpErrorResponse({ status: 401 });
      authServiceSpy.login.and.returnValue(throwError(() => error));

      component.userForm.setValue({ username: 'user', password: 'pass' });
      component.login();
      tick();

      expect(routerSpy.navigate).not.toHaveBeenCalled();
    }));
  });
});
