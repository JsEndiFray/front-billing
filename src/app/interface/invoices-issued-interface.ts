/**
 * Interface para facturas emitidas - datos base CON CAMPOS DE COBRO (antes 'pago')
 */
export interface Invoice { // CAMBIO: Renombrado de Bill a Invoice

  // Propiedades generales de la factura
  id?: number | null;
  invoice_number?: string;
  estates_id?: number | null; // Cambio a number para el ID numérico
  estate_name?: string | null; // Nombre de la propiedad (viene del join)
  clients_id?: number | null; // Cambio a number para el ID numérico
  client_name?: string | null; // Nombre del cliente (viene del join)
  owners_id?: number | null; // Cambio a number para el ID numérico
  owner_name?: string | null; // Nombre del propietario (viene del join)
  invoice_date?: string; // CAMBIO: date a invoice_date
  due_date?: string | null; // Fecha de vencimiento
  ownership_percent?: number | null
  tax_base?: number | null;
  iva?: number | null;
  irpf?: number | null;
  total?: number | null;
  is_refund?: number | null;
  original_invoice_id?: number | null; // CAMBIO: original_bill_id a original_invoice_id
  original_invoice_number?: string | null; // CAMBIO: original_bill_number a original_invoice_number

  // Propiedades de COBRO (antes 'pago')
  collection_status?: 'pending' | 'collected' | 'overdue' | 'disputed'; // CAMBIO: payment_status a collection_status, y 'paid' a 'collected'
  collection_method?: 'transfer' | 'direct_debit' | 'cash' | 'card' | 'check'; // CAMBIO: payment_method a collection_method (añadido 'check')
  collection_date?: string | null; // CAMBIO: payment_date a collection_date
  collection_reference?: string | null; // Nueva propiedad: Referencia del cobro
  collection_notes?: string | null; // CAMBIO: payment_notes a collection_notes

  // Propiedades de FACTURACIÓN PROPORCIONAL
  start_date?: string;
  end_date?: string;
  corresponding_month?: string | null;
  is_proportional?: number | null;

  // Metadatos
  created_at?: string; // CAMBIO: date_create a created_at
  updated_at?: string; // CAMBIO: date_update a updated_at

  // Propiedades adicionales que los PDFs pueden necesitar y que vendrían del JOIN en el repo
  // Estas no son parte de la tabla `invoices_issued` directamente, pero son útiles para el frontend/PDF
  client_identification?: string | null;
  client_company_name?: string | null;
  client_address?: string | null;
  client_postal_code?: string | null;
  client_location?: string | null;
  client_province?: string | null;
  client_country?: string | null;
  client_phone?: string | null;
  owner_identification?: string | null;
  owner_address?: string | null;
  owner_postal_code?: string | null;
  owner_location?: string | null;
  owner_province?: string | null;
  owner_country?: string | null;
  owner_phone?: string | null;
  bank_name?: string | null; // Asumiendo que el propietario tiene esta info
  account_holder?: string | null; // Asumiendo que el propietario tiene esta info
  iban?: string | null; // Asumiendo que el propietario tiene esta info
  has_attachments?: boolean | null; // Si la factura tiene adjuntos (desde repo)
  pdf_path?: string | null; // Ruta al PDF (desde repo)
}

/**
 * Interface para abonos (facturas rectificativas)
 */
export interface RefundInvoice { // CAMBIO: Renombrado de Refunds a RefundInvoice
  id?: number;
  originalInvoiceId: number; // REQUERIDO - ID de la factura original
  invoice_date: string;      // REQUERIDO - Fecha de emisión del abono (antes bill_date)
  amount: number;            // REQUERIDO - Importe del abono (negativo)
  concept?: string;          // OPCIONAL - Concepto del abono
  is_refund?: boolean;       // Se asigna automáticamente como true
  collection_method?: string;
  // Las propiedades de `Invoice` también aplicarán a un abono internamente en el backend,
  // pero esta interfaz es más para los datos que se *envían* para crear un abono.
  // El backend completará el resto de campos al crearlo.
}

// ========================================
// Enums para uso en componentes - AHORA PARA COBROS
// ========================================
export enum CollectionStatus { // CAMBIO: PaymentStatus a CollectionStatus
  PENDING = 'pending',
  COLLECTED = 'collected', // CAMBIO: PAID a COLLECTED
  OVERDUE = 'overdue',     // Añadido desde backend
  DISPUTED = 'disputed'    // Añadido desde backend
}

export enum CollectionMethod { // CAMBIO: PaymentMethod a CollectionMethod
  TRANSFER = 'transfer',
  DIRECT_DEBIT = 'direct_debit',
  CASH = 'cash',
  CARD = 'card',
  CHECK = 'check' // Añadido desde backend
}

/**
 * Labels para mostrar en la interfaz de usuario
 */
export const COLLECTION_STATUS_LABELS = { // CAMBIO: PAYMENT_STATUS_LABELS a COLLECTION_STATUS_LABELS
  pending: 'Pendiente',
  collected: 'Cobrado', // CAMBIO: paid a collected
  overdue: 'Vencida',
  disputed: 'Disputada'
};

export const COLLECTION_METHOD_LABELS = { // CAMBIO: PAYMENT_METHOD_LABELS a COLLECTION_METHOD_LABELS
  transfer: 'Transferencia',
  direct_debit: 'Domiciliado',
  cash: 'Efectivo',
  card: 'Tarjeta',
  check: 'Cheque'
};

// ========================================
// 🆕 NUEVAS ADICIONES PARA FACTURACIÓN PROPORCIONAL (Se mantienen)
// ========================================
export const BILLING_TYPE_LABELS = {
  0: 'Mes completo',
  1: 'Proporcional por días'
} as const;

/**
 * 🆕 Interfaz para simulación de facturación proporcional
 */
export interface ProportionalSimulation {
  tax_base: number;
  iva?: number;
  irpf?: number;
  start_date?: string;
  end_date?: string;
}

/**
 * 🆕 Interfaz para respuesta de simulación
 */
export interface ProportionalSimulationResponse {
  total: number;
  calculation_type: 'normal' | 'proportional';
  details: {
    original_base: number;
    proportional_base: number;
    days_billed: number;
    days_in_month: number;
    proportion_percentage: number;
    iva_amount: number;
    irpf_amount: number;
  };
  periodDescription: string;
  simulation: boolean;
}

/**
 * 🆕 Interfaz para validación de fechas
 */
export interface DateRangeValidation {
  startDate: string;
  endDate: string;
}

/**
 * 🆕 Interfaz para respuesta de validación de fechas
 */
export interface DateRangeValidationResponse {
  isValid: boolean;
  message: string;
  daysBilled?: number;
  periodDescription?: string;
}

/**
 * 🆕 Interfaz para respuesta de detalles de cálculo proporcional
 */
export interface ProportionalCalculationDetails {
  type: 'normal' | 'proportional';
  days_billed?: number;
  days_in_month?: number;
  proportion_percentage?: number;
  original_base: number;
  proportional_base?: number;
  total: number;
}

// ========================================
// INTERFACES PARA ESTADÍSTICAS Y REPORTES
// ========================================

/**
 * Interfaz para estadísticas generales de facturas emitidas
 */
export interface InvoiceStats {
  total_invoices: number;
  pending_invoices: number;
  collected_invoices: number;
  overdue_invoices: number;
  total_amount: number;
  total_iva_repercutido: number;
  total_irpf_retenido: number;
  pending_amount: number;
  percentage_collected: number;
}

/**
 * Interfaz para estadísticas por cliente
 */
export interface ClientStats {
  client_name: string;
  client_nif: string;
  invoice_count: number;
  total_amount: number;
  total_iva: number;
  total_irpf: number;
}

/**
 * Interfaz para estadísticas por propietario
 */
export interface OwnerStats {
  owner_name: string;
  owner_nif: string;
  invoice_count: number;
  total_amount: number;
  avg_amount: number;
}

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


