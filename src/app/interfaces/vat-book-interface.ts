/**
 * Interfaces para el Libro de IVA (VAT Book)
 * Basadas en las respuestas del backend según normativa AEAT
 */

// ==========================================
// RESPUESTA GENÉRICA DEL BACKEND
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

// ==========================================
// ENTRADA DEL LIBRO (FACTURAS)
// ==========================================

export interface VATBookEntry {
  numeroRegistro?: number;
  numeroFactura: string;
  fechaFactura: string;
  fechaOperacion?: string;
  nombreProveedor?: string;  // Para IVA Soportado
  nombreCliente?: string;     // Para IVA Repercutido
  nifProveedor?: string;      // Para IVA Soportado
  nifCliente?: string;        // Para IVA Repercutido
  baseImponible: number;
  tipoIVA: number;
  cuotaIVA: number;
  tipoRecargoEquivalencia?: number;
  cuotaRecargoEquivalencia?: number;
  totalFactura?: number;
  importeTotal?: number;
  deducible?: boolean;
  conceptoGasto?: string;
  concepto?: string;
  estadoPago?: string;
  claveOperacion?: string;
  reglainversion?: boolean;
  origin?: string;
}

// ==========================================
// TOTALES DEL LIBRO
// ==========================================

export interface VATBookTotals {
  totalBaseImponible: number;
  totalCuotaIVA: number;
  totalRecargoEquivalencia?: number;
  totalFacturas: number;
  cuotaIVADeducible?: number;
}

// ==========================================
// RESUMEN DEL LIBRO
// ==========================================

export interface VATBookSummary {
  byVATRate: Array<{
    rate: number;
    baseImponible: number;
    cuotaIVA: number;
    count: number;
  }>;
  totalEntries: number;
  totalBase: number;
  totalVAT: number;
}

// ==========================================
// LIBRO DE IVA SOPORTADO (FACTURAS RECIBIDAS)
// ==========================================

export interface VATSupportedBook {
  bookType: 'CHARGED_VAT';
  bookCode: 'E';
  year: number;
  quarter: number | null;
  month: number | null;
  period: string;
  entries: VATBookEntry[];
  totals: VATBookTotals;
  summary: VATBookSummary;
  generatedAt: string;
  entryCount: number;
}

// ==========================================
// LIBRO DE IVA REPERCUTIDO (FACTURAS EMITIDAS)
// ==========================================

export interface VATChargedBook {
  bookType: 'IVA_REPERCUTIDO';
  bookCode: 'E';
  year: number;
  quarter: number | null;
  month: number | null;
  period: string;
  entries: VATBookEntry[];
  totals: VATBookTotals;
  summary: VATBookSummary;
  generatedAt: string;
  entryCount: number;
}

// ==========================================
// RESUMEN POR PROPIETARIO
// ==========================================

export interface OwnerVATSummary {
  owner_id: number;
  owner_name: string;
  ownership_percent: number;
  vat_charged: number;
  vat_supported: number;
  net_vat: number;
  total_invoices_issued: number;
  total_invoices_received: number;
  total_internal_expenses: number;
}

export interface VATBookByOwner {
  bookType: 'IVA_CONSOLIDADO_POR_PROPIETARIO';
  year: number;
  quarter: number | null;
  month: number | null;
  period: string;
  summary_by_owner: OwnerVATSummary[];
  overall_total: {
    total_vat_charged: number;
    total_vat_supported: number;
    net_vat: number;
  };
  generatedAt: string;
}

// ==========================================
// LIBRO CONSOLIDADO (PARA EL COMPONENTE)
// ==========================================

export interface ConsolidatedVATBook {
  supported: VATBookEntry[];
  charged: VATBookEntry[];
  summaryByOwner: OwnerVATSummary[];
}

// ==========================================
// LIQUIDACIÓN TRIMESTRAL
// ==========================================

export interface VATLiquidation {
  netResult: number;
  payable?: number;
  refundable?: number;
}

export interface QuarterlyVATLiquidation {
  year: number;
  quarter: number;
  period: string;
  supportedBook: VATSupportedBook;
  chargedBook: VATChargedBook;
  liquidation: VATLiquidation;
  generatedAt: string;
}

// ==========================================
// ESTADÍSTICAS ANUALES
// ==========================================

export interface QuarterlyVATData {
  quarter: number;
  totalSupported: number;
  totalCharged: number;
  balance: number;
  growthRate?: number;
}

export interface AnnualVATStats {
  year: number;
  quarterlyData: QuarterlyVATData[];
  annualTotals: {
    totalSupported: number;
    totalCharged: number;
    netBalance: number;
  };
  generatedAt: string;
}

// ==========================================
// COMPARACIÓN TRIMESTRAL
// ==========================================

export interface QuarterlyVATComparison {
  year: number;
  quarters: QuarterlyVATData[];
  generatedAt: string;
}

// ==========================================
// CONFIGURACIÓN
// ==========================================

export interface VATBookConfig {
  availableYears: number[];
  supportedFormats: string[];
  vatRates: number[];
  bookTypes: string[];
  generatedAt: string;
}

// ==========================================
// DATOS COMPLETOS
// ==========================================

export interface CompleteVATBooks {
  period: string;
  supportedBook: VATSupportedBook;
  chargedBook: VATChargedBook;
  summary: {
    totalSupported: number;
    totalCharged: number;
    difference: number;
    status: string;
  };
}

// ==========================================
// EXPORTACIÓN
// ==========================================

export interface ExportVATBookRequest {
  year: number;
  quarter?: number;
  month?: number;
  bookType: 'supported' | 'charged' | 'both';
  format: 'excel' | 'pdf' | 'csv';
}

export interface ExportVATBookResponse {
  fileName: string;
  filePath: string;
  generatedAt: string;
}
