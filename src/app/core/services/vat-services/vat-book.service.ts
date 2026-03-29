import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../api-service/api.service';
import {
  ConsolidatedVATBook,
  ApiResponse
} from '../../../interfaces/vat-book-interface';


/**
 * Servicio para el Libro de IVA.
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
  private readonly _downloading = signal<boolean>(false);

  // ── Signals de solo lectura (API pública para componentes) ────────────────
  readonly vatData     = this._vatData.asReadonly();
  readonly loading     = this._loading.asReadonly();
  readonly error       = this._error.asReadonly();
  readonly downloading = this._downloading.asReadonly();

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
   * Descarga Excel del libro de IVA y lo guarda en el navegador
   */
  downloadExcel(year: number, quarter?: number, month?: number, bookType: 'supported' | 'charged' | 'both' = 'both'): void {
    this._downloading.set(true);
    const body = { year, quarter: quarter ?? null, month: month ?? null, bookType };

    this.apiService.postBlob('vat-book/download/excel', body).subscribe({
      next: (blob) => {
        this.triggerDownload(blob, `libro-iva-${year}.xlsx`);
        this._downloading.set(false);
      },
      error: () => this._downloading.set(false)
    });
  }

  /**
   * Descarga PDF del libro de IVA y lo guarda en el navegador
   */
  downloadPDF(year: number, quarter?: number, month?: number, bookType: 'supported' | 'charged' | 'both' = 'both'): void {
    this._downloading.set(true);
    const body = { year, quarter: quarter ?? null, month: month ?? null, bookType };

    this.apiService.postBlob('vat-book/download/pdf', body).subscribe({
      next: (blob) => {
        this.triggerDownload(blob, `libro-iva-${year}.pdf`);
        this._downloading.set(false);
      },
      error: () => this._downloading.set(false)
    });
  }

  /**
   * Limpia los datos del signal
   */
  clearData(): void {
    this._vatData.set(null);
    this._error.set(null);
  }

  // ── Helpers privados ──────────────────────────────────────────────────────

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
