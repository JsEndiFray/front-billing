
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
