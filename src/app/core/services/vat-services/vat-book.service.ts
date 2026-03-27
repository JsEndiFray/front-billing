import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../api-service/api.service'
import {
  ConsolidatedVATBook,
  VATBookConfig,
  AnnualVATStats,
  QuarterlyVATComparison,
  QuarterlyVATLiquidation, ApiResponse
} from '../../../interfaces/vat-book-interface';


/**
 * Servicio para el Libro de IVA
 * Usa signals de Angular 19 para estado reactivo.
 * Los WritableSignals son privados — los componentes acceden
 * solo a los signals de solo lectura expuestos públicamente.
 */
@Injectable({
  providedIn: 'root'
})
export class VatBookService {
  private readonly apiService = inject(ApiService);

  // ── WritableSignals privados (solo este servicio puede mutar) ─────────────
  private readonly _vatData = signal<ConsolidatedVATBook | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error   = signal<string | null>(null);

  // ── Signals de solo lectura (API pública para componentes) ────────────────
  readonly vatData = this._vatData.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error   = this._error.asReadonly();

  /**
   * Obtiene el libro consolidado (soportado + repercutido + resumen por propietario)
   */
  getConsolidatedBook(year: number, quarter?: number, month?: number): void {
    this._loading.set(true);
    this._error.set(null);

    let endpoint = `vat-book/consolidated/${year}`;
    if (quarter) endpoint += `/${quarter}`;
    if (month)   endpoint += `/${month}`;

    this.apiService.get<ApiResponse<ConsolidatedVATBook>>(endpoint)
      .subscribe({
        next: (response) => {
          this._vatData.set(response.data);
          this._loading.set(false);
        },
        error: (err) => {
          this._error.set(err.message || 'Error al cargar datos');
          this._loading.set(false);
        }
      });
  }

  /**
   * Obtiene estadísticas anuales
   * TODO (deuda técnica): resultado no se almacena en signal — ver deuda técnica #4
   */
  getAnnualStats(year: number): void {
    this._loading.set(true);
    this._error.set(null);

    this.apiService.get<ApiResponse<AnnualVATStats>>(`vat-book/stats/${year}`)
      .subscribe({
        next: () => {
          this._loading.set(false);
        },
        error: (err) => {
          this._error.set(err.message || 'Error al cargar estadísticas');
          this._loading.set(false);
        }
      });
  }

  /**
   * Obtiene comparación trimestral
   * TODO (deuda técnica): resultado no se almacena en signal — ver deuda técnica #4
   */
  getQuarterlyComparison(year: number): void {
    this._loading.set(true);
    this._error.set(null);

    this.apiService.get<ApiResponse<QuarterlyVATComparison>>(`vat-book/comparison/${year}`)
      .subscribe({
        next: () => {
          this._loading.set(false);
        },
        error: (err) => {
          this._error.set(err.message || 'Error al cargar comparación');
          this._loading.set(false);
        }
      });
  }

  /**
   * Obtiene liquidación trimestral
   * TODO (deuda técnica): resultado no se almacena en signal — ver deuda técnica #4
   */
  getQuarterlyLiquidation(year: number, quarter: number): void {
    this._loading.set(true);
    this._error.set(null);

    this.apiService.get<ApiResponse<QuarterlyVATLiquidation>>(`vat-book/liquidation/${year}/${quarter}`)
      .subscribe({
        next: () => {
          this._loading.set(false);
        },
        error: (err) => {
          this._error.set(err.message || 'Error al cargar liquidación');
          this._loading.set(false);
        }
      });
  }

  /**
   * Obtiene configuración disponible
   * TODO (deuda técnica): resultado no se almacena en signal — ver deuda técnica #4
   */
  getConfig(): void {
    this._loading.set(true);
    this._error.set(null);

    this.apiService.get<ApiResponse<VATBookConfig>>('vat-book/config')
      .subscribe({
        next: () => {
          this._loading.set(false);
        },
        error: (err) => {
          this._error.set(err.message || 'Error al cargar configuración');
          this._loading.set(false);
        }
      });
  }

  /**
   * Descarga Excel del libro de IVA desde el backend
   * TODO (deuda técnica): no gestiona blob ni estado loading — ver deuda técnica #3
   */
  downloadExcel(year: number, quarter?: number, month?: number, bookType: 'supported' | 'charged' | 'both' = 'both'): void {
    const body = {
      year,
      quarter: quarter || null,
      month:   month   || null,
      bookType
    };

    this.apiService.post('vat-book/download/excel', body)
      .subscribe({
        next:  () => { /* descarga pendiente de implementar — deuda técnica #3 */ },
        error: () => { /* error manejado por interceptor */ }
      });
  }

  /**
   * Descarga PDF del libro de IVA desde el backend
   * TODO (deuda técnica): no gestiona blob ni estado loading — ver deuda técnica #3
   */
  downloadPDF(year: number, quarter?: number, month?: number, bookType: 'supported' | 'charged' | 'both' = 'both'): void {
    const body = {
      year,
      quarter: quarter || null,
      month:   month   || null,
      bookType
    };

    this.apiService.post('vat-book/download/pdf', body)
      .subscribe({
        next:  () => { /* descarga pendiente de implementar — deuda técnica #3 */ },
        error: () => { /* error manejado por interceptor */ }
      });
  }

  /**
   * Limpia los datos del signal
   */
  clearData(): void {
    this._vatData.set(null);
    this._error.set(null);
  }
}
