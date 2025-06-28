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
