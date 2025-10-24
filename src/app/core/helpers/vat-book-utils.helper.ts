import { Injectable } from '@angular/core';
import { DataTransformHelper } from './data-transform.helper';
import { VatRatesHelper } from './vat-rates.helper';
import { VATBookEntry, OwnerVATSummary } from '../../interfaces/vat-book-interface';

/**
 * Helper específico para el Libro de IVA
 * Reutiliza DataTransformHelper y VatRatesHelper
 */
@Injectable({
  providedIn: 'root'
})
export class VatBookUtilsHelper {

  constructor(private dataTransform: DataTransformHelper) {}

  // ==========================================================
  // FORMATEO DE DATOS
  // ==========================================================

  /**
   * Formatea un monto con símbolo de euro
   */
  formatAmount(amount: unknown): string {
    return this.dataTransform.formatAmountLocale(amount);
  }

  /**
   * Formatea una fecha en formato español
   */
  formatDate(date: unknown): string {
    return this.dataTransform.formatDateLocale(date);
  }

  /**
   * Trunca texto largo
   */
  truncateText(text: unknown, maxLength: number = 50): string {
    return this.dataTransform.truncateText(text, maxLength);
  }

  // ==========================================================
  // ETIQUETAS Y LABELS
  // ==========================================================

  /**
   * Obtiene la etiqueta descriptiva para un tipo de IVA
   */
  getVatRateLabel(rate: number | undefined): string {
    return VatRatesHelper.getLabel(rate);
  }

  /**
   * Obtiene el label para el tipo de libro
   */
  getBookTypeLabel(bookType: string): string {
    switch (bookType) {
      case 'CHARGED_VAT':
        return 'IVA Soportado';
      case 'IVA_REPERCUTIDO':
        return 'IVA Repercutido';
      case 'IVA_CONSOLIDADO_POR_PROPIETARIO':
        return 'Resumen por Propietario';
      default:
        return bookType;
    }
  }

  // ==========================================================
  // CLASES CSS PARA BADGES
  // ==========================================================

  /**
   * Obtiene clase CSS para el badge de tipo de IVA
   */
  getVatRateClass(rate: number | undefined): string {
    const num = Number(rate) || 0;

    switch (num) {
      case 21:
        return 'vat-rate-general';
      case 10:
        return 'vat-rate-reduced';
      case 4:
        return 'vat-rate-super-reduced';
      case 0:
        return 'vat-rate-exempt';
      default:
        return 'vat-rate-other';
    }
  }

  /**
   * Obtiene clase CSS para el badge de deducible
   */
  getDeductibleClass(isDeductible: boolean | undefined): string {
    return isDeductible ? 'deductible-badge' : 'non-deductible-badge';
  }

  /**
   * Obtiene label para deducible
   */
  getDeductibleLabel(isDeductible: boolean | undefined): string {
    return isDeductible ? 'Deducible' : 'No deducible';
  }

  // ==========================================================
  // CÁLCULOS Y TOTALES
  // ==========================================================

  /**
   * Calcula el total de base imponible de un array de entradas
   */
  calculateTotalBase(entries: VATBookEntry[]): number {
    return entries.reduce((sum, entry) => sum + (entry.baseImponible || 0), 0);
  }

  /**
   * Calcula el total de cuota IVA de un array de entradas
   */
  calculateTotalVAT(entries: VATBookEntry[]): number {
    return entries.reduce((sum, entry) => sum + (entry.cuotaIVA || 0), 0);
  }

  /**
   * Calcula el total de facturas de un array de entradas
   */
  calculateTotalInvoices(entries: VATBookEntry[]): number {
    return entries.reduce((sum, entry) => sum + (entry.totalFactura || 0), 0);
  }

  /**
   * Calcula estadísticas de un libro
   */
  calculateBookStats(entries: VATBookEntry[]) {
    const totalBase = this.calculateTotalBase(entries);
    const totalVAT = this.calculateTotalVAT(entries);
    const totalInvoices = this.calculateTotalInvoices(entries);
    const averageVAT = entries.length > 0 ? totalVAT / entries.length : 0;

    // Agrupar por tipo de IVA
    const byVATRate = entries.reduce((acc, entry) => {
      const rate = entry.tipoIVA || 0;
      if (!acc[rate]) {
        acc[rate] = {
          count: 0,
          totalBase: 0,
          totalVAT: 0
        };
      }
      acc[rate].count++;
      acc[rate].totalBase += entry.baseImponible || 0;
      acc[rate].totalVAT += entry.cuotaIVA || 0;
      return acc;
    }, {} as Record<number, { count: number; totalBase: number; totalVAT: number }>);

    return {
      totalEntries: entries.length,
      totalBase,
      totalVAT,
      totalInvoices,
      averageVAT,
      byVATRate
    };
  }

  // ==========================================================
  // FILTRADO Y BÚSQUEDA
  // ==========================================================

  /**
   * Filtra entradas por texto de búsqueda
   */
  filterBySearch(entries: VATBookEntry[], searchText: string): VATBookEntry[] {
    if (!searchText || searchText.trim() === '') {
      return entries;
    }

    const search = searchText.toLowerCase().trim();

    return entries.filter(entry =>
      entry.numeroFactura?.toLowerCase().includes(search) ||
      entry.nombreProveedor?.toLowerCase().includes(search) ||
      entry.nombreCliente?.toLowerCase().includes(search) ||
      entry.nifProveedor?.toLowerCase().includes(search) ||
      entry.nifCliente?.toLowerCase().includes(search) ||
      entry.conceptoGasto?.toLowerCase().includes(search) ||
      entry.concepto?.toLowerCase().includes(search)
    );
  }

  /**
   * Ordena entradas por campo
   */
  sortEntries(
    entries: VATBookEntry[],
    field: keyof VATBookEntry,
    direction: 'asc' | 'desc'
  ): VATBookEntry[] {
    return [...entries].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      let comparison = 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      }

      return direction === 'asc' ? comparison : -comparison;
    });
  }

  // ==========================================================
  // VALIDACIONES
  // ==========================================================

  /**
   * Valida si una entrada tiene datos completos
   */
  isEntryValid(entry: VATBookEntry): boolean {
    return !!(
      entry.numeroFactura &&
      entry.fechaFactura &&
      (entry.nombreProveedor || entry.nombreCliente) &&
      (entry.nifProveedor || entry.nifCliente) &&
      entry.baseImponible !== undefined &&
      entry.tipoIVA !== undefined &&
      entry.cuotaIVA !== undefined
    );
  }

  // ==========================================================
  // UTILIDADES PARA RESUMEN POR PROPIETARIO
  // ==========================================================

  /**
   * Calcula el IVA neto total de todos los propietarios
   */
  calculateTotalNetVAT(summaries: OwnerVATSummary[]): number {
    return summaries.reduce((sum, owner) => sum + (owner.net_vat || 0), 0);
  }

  /**
   * Obtiene clase CSS según el balance neto de IVA
   */
  getNetVATClass(netVAT: number): string {
    if (netVAT > 0) return 'net-vat-positive'; // A pagar
    if (netVAT < 0) return 'net-vat-negative'; // A favor
    return 'net-vat-zero'; // Neutro
  }

  /**
   * Obtiene label descriptivo del balance neto
   */
  getNetVATLabel(netVAT: number): string {
    if (netVAT > 0) return 'A pagar';
    if (netVAT < 0) return 'A favor';
    return 'Sin diferencia';
  }

  // ==========================================================
  // FORMATEO DE PERÍODOS
  // ==========================================================

  /**
   * Obtiene label para el período seleccionado
   */
  getPeriodLabel(year: number, quarter?: number, month?: number): string {
    if (month) {
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      return `${monthNames[month - 1]} ${year}`;
    }

    if (quarter) {
      return `T${quarter} ${year}`;
    }

    return `Año ${year}`;
  }

  /**
   * Obtiene opciones de años disponibles (últimos 5 años + año actual)
   */
  getAvailableYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];

    for (let i = 0; i < 6; i++) {
      years.push(currentYear - i);
    }

    return years;
  }

  /**
   * Obtiene opciones de trimestres
   */
  getQuarters() {
    return [
      { value: null, label: 'Todo el año' },
      { value: 1, label: 'T1' },
      { value: 2, label: 'T2' },
      { value: 3, label: 'T3' },
      { value: 4, label: 'T4' }
    ];
  }

  /**
   * Obtiene opciones de meses
   */
  getMonths() {
    return [
      { value: 1, label: 'Enero' },
      { value: 2, label: 'Febrero' },
      { value: 3, label: 'Marzo' },
      { value: 4, label: 'Abril' },
      { value: 5, label: 'Mayo' },
      { value: 6, label: 'Junio' },
      { value: 7, label: 'Julio' },
      { value: 8, label: 'Agosto' },
      { value: 9, label: 'Septiembre' },
      { value: 10, label: 'Octubre' },
      { value: 11, label: 'Noviembre' },
      { value: 12, label: 'Diciembre' }
    ];
  }
}
