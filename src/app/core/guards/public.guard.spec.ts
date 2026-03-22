import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { publicGuard } from './public.guard';
import { AuthService } from '../services/auth-services/auth.service';

// Placeholder args — publicGuard ignores route and state, only calls inject()
const dummyRoute = {} as ActivatedRouteSnapshot;
const dummyState = {} as RouterStateSnapshot;

describe('publicGuard', () => {
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

  it('should return TRUE and allow access to /login when user is NOT authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      publicGuard(dummyRoute, dummyState)
    );

    expect(result).toBeTrue();
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('should return a UrlTree pointing to /dashboards when user IS authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      publicGuard(dummyRoute, dummyState)
    );

    expect(routerSpy.createUrlTree).toHaveBeenCalledOnceWith(['/dashboards']);
    expect(result).toBe(mockUrlTree);
  });

  it('should delegate authentication check entirely to AuthService', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);

    TestBed.runInInjectionContext(() => publicGuard(dummyRoute, dummyState));

    expect(authServiceSpy.isAuthenticated).toHaveBeenCalled();
  });
});
