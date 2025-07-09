/**
 * Interface para facturas - datos base CON CAMPOS DE PAGO
 */
export interface Bill {

//interface general
  id?: number | null;
  bill_number?: string;
  estates_id?: string | null;
  clients_id?: string | null;
  owners_id?: string | null;
  ownership_percent?: number | null;
  date?: string;
  tax_base?: number | null;
  iva?: number | null;
  irpf?: number | null;
  total?: number | null;
  is_refund?: number | null;
  original_bill_id?: number | null;
  original_bill_number?: string | null;
  //NUEVOS CAMPOS DE PAGO
  payment_status?: 'pending' | 'paid';
  payment_method?: 'direct_debit' | 'cash' | 'card' | 'transfer';
  payment_date?: string | null;
  payment_notes?: string | null;
//NUEVOS CAMPOS PROPORCIONALES
  start_date?: string | null;              // Fecha inicio del periodo (YYYY-MM-DD)
  end_date?: string | null;                // Fecha fin del periodo (YYYY-MM-DD)
  corresponding_month?: string | null;     // Mes de correspondencia (YYYY-MM)
  is_proportional?: number | null;         // 0 = normal, 1 = proporcional

  date_create?: string;
  date_update?: string;
}

/**
 * Interface para abonos
 */
export interface Refunds {
  id?: number;
  bill_number?: string;          // Se genera automáticamente
  originalBillId: number;      // REQUERIDO - ID de la factura original
  bill_date: string;             // REQUERIDO - Fecha de emisión del abono
  amount: number;                // REQUERIDO - Importe del abono
  concept?: string;              // OPCIONAL - Concepto del abono
  is_refund?: boolean;           // Se asigna automáticamente como true

  // Campos adicionales para uso interno del frontend
  payment_method?: string;       // Solo para frontend
  notes?: string;               // Solo para frontend
}

//NUEVAS INTERFACES PARA PAGOS
/**
 * Enums para uso en componentes
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid'
}

export enum PaymentMethod {
  DIRECT_DEBIT = 'direct_debit',
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer'
}
/**
 * Labels para mostrar en la interfaz de usuario
 */
export const PAYMENT_STATUS_LABELS = {
  pending: 'Pendiente',
  paid: 'Pagado'
};

export const PAYMENT_METHOD_LABELS = {
  direct_debit: 'Domiciliado',
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia'
};

// ========================================
// 🆕 NUEVAS ADICIONES PARA FACTURACIÓN PROPORCIONAL
// ========================================
export const BILLING_TYPE_LABELS = {
  0: '📅 Mes completo',
  1: '📊 Proporcional por días'
} as const;

/**
 * 🆕 Interfaz para simulación de facturación proporcional
 */
export interface ProportionalSimulation {
  tax_base: number;
  iva?: number;
  irpf?: number;
  start_date: string;
  end_date: string;
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
  start_date: string;
  end_date: string;
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
