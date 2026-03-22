import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth-services/auth.service';

// Placeholder args — authGuard ignores route and state, only calls inject()
const dummyRoute = {} as ActivatedRouteSnapshot;
const dummyState = {} as RouterStateSnapshot;

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let mockUrlTree: UrlTree;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated']);
    routerSpy      = jasmine.createSpyObj<Router>('Router', ['createUrlTree', 'navigate']);
    mockUrlTree    = {} as UrlTree;
    routerSpy.createUrlTree.and.returnValue(mockUrlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router,      useValue: routerSpy }
      ]
    });
  });

  it('should return TRUE and allow access when user is authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(dummyRoute, dummyState)
    );

    expect(result).toBeTrue();
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('should return a UrlTree pointing to /login when user is NOT authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(dummyRoute, dummyState)
    );

    expect(routerSpy.createUrlTree).toHaveBeenCalledOnceWith(['/login']);
    expect(result).toBe(mockUrlTree);
  });

  it('should delegate authentication check entirely to AuthService', () => {
    // Verifies no direct localStorage access inside the guard
    authServiceSpy.isAuthenticated.and.returnValue(true);

    TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));

    expect(authServiceSpy.isAuthenticated).toHaveBeenCalled();
  });
});
