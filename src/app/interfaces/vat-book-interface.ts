
/**
 * Interfaz para datos del libro de IVA (repercutido o soportado)
 */
export interface VATBookDataEntry {
  invoice_date: string;
  invoice_number: string;
  client_name?: string; // Para repercutido
  supplier_name?: string; // Para soportado
  client_nif?: string; // Para repercutido
  supplier_tax_id?: string; // Para soportado
  tax_base: number;
  iva_percentage: number;
  iva_amount: number;
  irpf_percentage: number;
  irpf_amount: number;
  total: number; // Para repercutido, total_amount para soportado (o mapear a total)
  is_deductible?: boolean; // Solo para soportado
  receipt_number?: string; // Solo para gastos internos
  // Propiedades adicionales si el backend las retorna
  description?: string; // Concepto
  category?: string;
  subcategory?: string;
  type?: string; // 'FACTURA_RECIBIDA', 'GASTO_INTERNO', 'FACTURA_EMITIDA'
  bookType?: string; // 'IVA_SOPORTADO', 'IVA_REPERCUTIDO'
  bookCode?: string;
  period?: string;
  entryCount?: number;
  summary?: object; // Puede ser de tipo VATSupportedSummary o VATChargedSummary
  generatedAt?: string;
  totals?: { // Interfaz más detallada si se necesita
    totalEntradas: number;
    totalBaseImponible: number;
    totalCuotaIVA: number;
    totalCuotaIRPF: number;
    totalImporte: number;
    cuotaIVADeducible?: number; // Solo soportado
    baseImponibleDeducible?: number; // Solo soportado
    desgloseIVA: VATBreakdownItem[];
  }
}

/**
 * Interfaz para un elemento de desglose de IVA
 */
export interface VATBreakdownItem {
  tipoIVA: number;
  baseImponible: number;
  cuotaIVA: number;
  numeroFacturas: number;
}

/**
* Interfaz para balance de ingresos/gastos (simplified)
*/
export interface IncomeStatementEntry {
  type: string; // Ej. 'INGRESOS' o 'GASTOS_INTERNOS'
  total_amount: number;
  refunds_amount?: number; // Solo para ingresos
  net_amount?: number; // Solo para ingresos
  total_iva_soportado?: number; // Para gastos
  total_transactions?: number; // Para gastos
}

/**
 * Interfaz para resumen mensual de facturación
 */
export interface MonthlySummary {
  month: number;
  month_name: string;
  invoice_count: number;
  total_invoiced: number;
  total_refunded: number;
  net_amount: number;
}


