import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { fromEvent, merge, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

/**
 * Servicio para detectar inactividad del usuario.
 * Emite en timeout$ tras 15 minutos sin actividad.
 * AuthService se suscribe a timeout$ y gestiona el logout.
 */
@Injectable({
  providedIn: 'root'
})
export class UserActivityService implements OnDestroy {
  private readonly INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos
  private inactivityTimer: number | null = null;
  private destroy$ = new Subject<void>();
  private isActive = false;

  private readonly timeoutSubject = new Subject<void>();
  readonly timeout$ = this.timeoutSubject.asObservable();

  private readonly USER_EVENTS = [
    'click', 'mousemove', 'keypress', 'scroll',
    'touchstart', 'mousedown', 'keydown'
  ];

  constructor(private ngZone: NgZone) {}

  startMonitoring(): void {
    if (this.isActive) return;
    this.isActive = true;
    this.setupActivityListeners();
    this.resetInactivityTimer();
  }

  stopMonitoring(): void {
    this.isActive = false;
    this.clearInactivityTimer();
    this.destroy$.next();
  }

  private setupActivityListeners(): void {
    const events$ = this.USER_EVENTS.map(eventType => fromEvent(document, eventType));
    merge(...events$).pipe(
      debounceTime(1000),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.isActive) this.resetInactivityTimer();
    });
  }

  private resetInactivityTimer(): void {
    this.clearInactivityTimer();
    this.ngZone.runOutsideAngular(() => {
      this.inactivityTimer = window.setTimeout(() => {
        this.ngZone.run(() => {
          this.stopMonitoring();
          this.timeoutSubject.next();
        });
      }, this.INACTIVITY_TIMEOUT);
    });
  }

  private clearInactivityTimer(): void {
    if (this.inactivityTimer !== null) {
      window.clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
    this.timeoutSubject.complete();
  }
}
