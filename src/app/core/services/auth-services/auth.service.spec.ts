import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';
import { ApiService } from '../api-service/api.service';
import { UserActivityService } from './user-activity.service';

/** Creates a minimal JWT-like token whose payload has the given exp offset (seconds from now) */
function makeToken(expOffsetSeconds: number): string {
  const payload = btoa(JSON.stringify({
    id: 1,
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + expOffsetSeconds
  }));
  // header.payload.signature — only the payload is parsed by the service
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.mock-signature`;
}

describe('AuthService', () => {
  let service: AuthService;
  let routerSpy: jasmine.SpyObj<Router>;
  let userActivitySpy: jasmine.SpyObj<UserActivityService>;

  beforeEach(() => {
    // Clear storage BEFORE the service is instantiated so initializeSession()
    // finds no token and starts no timers/monitoring
    localStorage.clear();

    routerSpy       = jasmine.createSpyObj<Router>('Router', ['navigate']);
    userActivitySpy = jasmine.createSpyObj<UserActivityService>(
      'UserActivityService', ['startMonitoring', 'stopMonitoring']
    );

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService,           useValue: jasmine.createSpyObj('ApiService', ['post']) },
        { provide: Router,               useValue: routerSpy },
        { provide: UserActivityService,  useValue: userActivitySpy }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => localStorage.clear());

  // ─── isAuthenticated() ───────────────────────────────────────────────────

  describe('isAuthenticated()', () => {
    it('should return FALSE when no token exists in localStorage', () => {
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('should return FALSE when token is expired', () => {
      localStorage.setItem('token', makeToken(-3600)); // expired 1h ago
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('should return TRUE when token is valid', () => {
      localStorage.setItem('token', makeToken(3600)); // valid for 1h
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should remove the token from localStorage when it is expired', () => {
      localStorage.setItem('token', makeToken(-3600));
      service.isAuthenticated();
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should also clear refreshToken and userData when token is expired', () => {
      localStorage.setItem('token',        makeToken(-3600));
      localStorage.setItem('refreshToken', 'old-refresh');
      localStorage.setItem('userData',     '{"username":"test"}');

      service.isAuthenticated();

      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('userData')).toBeNull();
    });

    it('should return FALSE for a malformed token', () => {
      localStorage.setItem('token', 'this.is.not.a.valid.jwt');
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('should clear storage when token is malformed', () => {
      localStorage.setItem('token',        'bad-token');
      localStorage.setItem('refreshToken', 'some-refresh');
      service.isAuthenticated();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  // ─── logout() ────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('should remove token from localStorage', () => {
      localStorage.setItem('token', 'test-token');
      service.logout();
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should remove refreshToken from localStorage', () => {
      localStorage.setItem('refreshToken', 'test-refresh');
      service.logout();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('should remove userData from localStorage', () => {
      localStorage.setItem('userData', '{"username":"test"}');
      service.logout();
      expect(localStorage.getItem('userData')).toBeNull();
    });

    it('should navigate to /login', () => {
      service.logout();
      expect(routerSpy.navigate).toHaveBeenCalledOnceWith(['/login']);
    });

    it('should stop activity monitoring', () => {
      service.logout();
      expect(userActivitySpy.stopMonitoring).toHaveBeenCalled();
    });
  });

  // ─── getUserData() ───────────────────────────────────────────────────────

  describe('getUserData()', () => {
    it('should return null when no userData in localStorage', () => {
      expect(service.getUserData()).toBeNull();
    });

    it('should return the parsed User object from localStorage', () => {
      const user = { id: 1, username: 'admin', role: 'admin', email: 'a@b.com', phone: '600', password: '' };
      localStorage.setItem('userData', JSON.stringify(user));
      expect(service.getUserData()?.username).toBe('admin');
    });
  });

  // ─── getCurrentUserRole() ────────────────────────────────────────────────

  describe('getCurrentUserRole()', () => {
    it('should default to "employee" when no userData', () => {
      expect(service.getCurrentUserRole()).toBe('employee');
    });

    it('should return the role stored in userData', () => {
      localStorage.setItem('userData', JSON.stringify({ role: 'admin' }));
      expect(service.getCurrentUserRole()).toBe('admin');
    });

    it('should default to "employee" when userData has no role field', () => {
      localStorage.setItem('userData', JSON.stringify({ username: 'test' }));
      expect(service.getCurrentUserRole()).toBe('employee');
    });
  });

  // ─── isAdmin() ───────────────────────────────────────────────────────────

  describe('isAdmin()', () => {
    it('should return FALSE when no userData in localStorage', () => {
      expect(service.isAdmin()).toBeFalse();
    });

    it('should return FALSE when user role is "employee"', () => {
      localStorage.setItem('userData', JSON.stringify({ role: 'employee' }));
      expect(service.isAdmin()).toBeFalse();
    });

    it('should return TRUE when user role is "admin"', () => {
      localStorage.setItem('userData', JSON.stringify({ role: 'admin' }));
      expect(service.isAdmin()).toBeTrue();
    });
  });
});
