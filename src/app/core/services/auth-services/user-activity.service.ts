import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { fromEvent, merge, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import {Router} from '@angular/router';

/**
 * Servicio para detectar inactividad del usuario
 * Cierra sesión automáticamente después de 15 minutos sin actividad
 */
@Injectable({
  providedIn: 'root'
})
export class UserActivityService implements OnDestroy {
  private readonly INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos
  private inactivityTimer: number | null = null;
  private destroy$ = new Subject<void>();
  private isActive = false;

  // Eventos que consideramos como actividad del usuario
  private readonly USER_EVENTS = [
    'click',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'mousedown',
    'keydown'
  ];

  constructor(
    private ngZone: NgZone,
    private router: Router
  ) {}

  /**
   * Inicia el monitoreo de actividad del usuario
   */
  startMonitoring(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.setupActivityListeners();
    this.resetInactivityTimer();
  }

  /**
   * Detiene el monitoreo de actividad
   */
  stopMonitoring(): void {
    this.isActive = false;
    this.clearInactivityTimer();
    this.destroy$.next();
  }

  /**
   * Configura los listeners para detectar actividad del usuario
   */
  private setupActivityListeners(): void {
    // Crear observables para cada tipo de evento
    const events$ = this.USER_EVENTS.map(eventType =>
      fromEvent(document, eventType)
    );

    // Combinar todos los eventos en un solo observable
    merge(...events$).pipe(
      debounceTime(1000), // Evitar demasiadas ejecuciones
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.onUserActivity();
    });
  }

  /**
   * Se ejecuta cuando se detecta actividad del usuario
   */
  private onUserActivity(): void {
    if (!this.isActive) return;

    this.resetInactivityTimer();
  }

  /**
   * Reinicia el timer de inactividad
   */
  private resetInactivityTimer(): void {
    this.clearInactivityTimer();

    this.ngZone.runOutsideAngular(() => {
      this.inactivityTimer = window.setTimeout(() => {
        this.ngZone.run(() => {
          this.handleInactivityTimeout();
        });
      }, this.INACTIVITY_TIMEOUT);
    });
  }

  /**
   * Limpia el timer de inactividad
   */
  private clearInactivityTimer(): void {
    if (this.inactivityTimer) {
      window.clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  /**
   * Maneja el timeout por inactividad - limpia tokens y redirige
   */
  private handleInactivityTimeout(): void {
    console.warn('Sesión cerrada por inactividad (15 minutos)');

    // Limpiar tokens directamente sin usar AuthService
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');

    // Redirigir al login
    this.router.navigate(['/login']);
  }

  /**
   * Cleanup al destruir el servicio
   */
  ngOnDestroy(): void {
    this.stopMonitoring();
  }
}
