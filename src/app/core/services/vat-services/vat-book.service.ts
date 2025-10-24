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
 * Usa signals de Angular 19 para estado reactivo
 */
@Injectable({
  providedIn: 'root'
})
export class VatBookService {
  private apiService = inject(ApiService);

  // Signals para el estado
  vatData = signal<ConsolidatedVATBook | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  /**
   * Obtiene el libro consolidado (soportado + repercutido + resumen por propietario)
   */
  getConsolidatedBook(year: number, quarter?: number, month?: number): void {
    this.loading.set(true);
    this.error.set(null);

    // Construir endpoint dinámicamente
    let endpoint = `vat-book/consolidated/${year}`;
    if (quarter) endpoint += `/${quarter}`;
    if (month) endpoint += `/${month}`;

    this.apiService.get<ApiResponse<ConsolidatedVATBook>>(endpoint)
      .subscribe({
        next: (response) => {
          this.vatData.set(response.data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Error al cargar datos');
          this.loading.set(false);
        }
      });
  }

  /**
   * Obtiene estadísticas anuales
   */
  getAnnualStats(year: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.get<ApiResponse<AnnualVATStats>>(`vat-book/stats/${year}`)
      .subscribe({
        next: (response) => {
          // Aquí podrías guardar en otro signal si lo necesitas
          console.log('Stats:', response.data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Error al cargar estadísticas');
          this.loading.set(false);
        }
      });
  }

  /**
   * Obtiene comparación trimestral
   */
  getQuarterlyComparison(year: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.get<ApiResponse<QuarterlyVATComparison>>(`vat-book/comparison/${year}`)
      .subscribe({
        next: (response) => {
          console.log('Comparación:', response.data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Error al cargar comparación');
          this.loading.set(false);
        }
      });
  }

  /**
   * Obtiene liquidación trimestral
   */
  getQuarterlyLiquidation(year: number, quarter: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.get<ApiResponse<QuarterlyVATLiquidation>>(`vat-book/liquidation/${year}/${quarter}`)
      .subscribe({
        next: (response) => {
          console.log('Liquidación:', response.data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Error al cargar liquidación');
          this.loading.set(false);
        }
      });
  }

  /**
   * Obtiene configuración disponible
   */
  getConfig(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.get<ApiResponse<VATBookConfig>>('vat-book/config')
      .subscribe({
        next: (response) => {
          console.log('Config:', response.data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Error al cargar configuración');
          this.loading.set(false);
        }
      });
  }

  /**
   * Descarga Excel del libro de IVA desde el backend
   */
  downloadExcel(year: number, quarter?: number, month?: number, bookType: 'supported' | 'charged' | 'both' = 'both'): void {
    const body = {
      year,
      quarter: quarter || null,
      month: month || null,
      bookType
    };

    // Llamada al backend que devuelve el archivo
    this.apiService.post('vat-book/download/excel', body)
      .subscribe({
        next: (response: unknown) => {
          console.log('Excel descargado correctamente', response);
        },
        error: (err) => {
          console.error('Error al descargar Excel:', err);
        }
      });
  }

  /**
   * Descarga PDF del libro de IVA desde el backend
   */
  downloadPDF(year: number, quarter?: number, month?: number, bookType: 'supported' | 'charged' | 'both' = 'both'): void {
    const body = {
      year,
      quarter: quarter || null,
      month: month || null,
      bookType
    };

    // Llamada al backend que devuelve el archivo
    this.apiService.post('vat-book/download/pdf', body)
      .subscribe({
        next: (response: unknown) => {
          console.log('PDF descargado correctamente', response);
        },
        error: (err) => {
          console.error('Error al descargar PDF:', err);
        }
      });
  }

  /**
   * Limpia los datos del signal
   */
  clearData(): void {
    this.vatData.set(null);
    this.error.set(null);
  }
}
