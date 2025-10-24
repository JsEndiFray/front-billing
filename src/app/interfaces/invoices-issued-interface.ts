/**
 * Interface para facturas emitidas - datos base CON CAMPOS DE COBRO (antes 'pago')
 */
export interface Invoice {
  id?: number | null;
  invoice_number?: string;
  estates_id?: number | null;
  estate_name?: string | null;
  clients_id?: number | null;
  client_name?: string | null;
  owners_id?: number | null;
  owner_name?: string | null;
  invoice_date?: string;
  due_date?: string | null;
  ownership_percent?: number | null
  tax_base?: number | null;
  iva?: number | null;
  irpf?: number | null;
  total?: number | null;
  is_refund?: 0 | 1;
  original_invoice_id?: number | null;
  original_invoice_number?: string | null;
  // Propiedades de COBRO (antes 'pago')
  collection_status?: 'pending' | 'collected' | 'overdue' | 'disputed';
  collection_method?: 'transfer' | 'direct_debit' | 'cash' | 'card' | 'check';
  collection_date?: string | null;
  collection_reference?: string;
  collection_notes?: string;
  // Propiedades de FACTURACIÓN PROPORCIONAL
  start_date?: string;
  end_date?: string;
  corresponding_month?: string | null;
  is_proportional?: 0 | 1;
  // Metadatos
  created_at?: string;
  updated_at?: string;
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
}
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

