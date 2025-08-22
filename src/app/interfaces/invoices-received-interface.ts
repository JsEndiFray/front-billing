/**
 * Interface para las facturas recibidas
 */
export interface InvoiceReceived {
  id?: number;
  invoice_number?: string;
  our_reference?: string;
  supplier_name?: string | null;
  property_id?: number;
  invoice_date?: string;           // Formato 'YYYY-MM-DD'
  due_date?: string;
  received_date?: string;
  tax_base?: number;
  iva_percentage?: number;
  iva_amount?: number;
  irpf_percentage?: number;
  irpf_amount?: number;
  total_amount?: number | null;
  total?: number | null;
  category?: 'electricidad' | 'gas' | 'agua' | 'comunidad' | 'seguros' | 'residuos' | 'mantenimiento' | 'reparaciones' | 'materiales' | 'otros' | 'internet' | 'telefono' | 'residuos' | 'impuestos' | 'servicios_profesionales';
  subcategory?: string;
  description?: string;
  //nuevas variables
  supplier_id?: number;
  concept?: string | null;
  attachments?: FileAttachment[];
  supplier_company?: string | null;
  supplier_tax_id?: string | null;
  days_overdue?: number; // Para facturas vencidas
  days_until_due?: number; // Para facturas próximas a vencer
// para el servicio http
  total_invoices?: number;
  pending_invoices?: number;
  paid_invoices?: number;
  overdue_invoices?: number;
  pending_amount?: number;
  count?: number;
  transaction_count?: number;
  month?: number;
  invoice_count?: number;


  notes?: string;
  collection_status?: 'pending' | 'paid' | 'overdue' | 'disputed';
  collection_method?: 'transfer' | 'direct_debit' | 'cash' | 'card' | 'check';
  collection_date?: string;
  collection_reference?: string;
  collection_notes?: string;
  start_date?: string;
  end_date?: string;
  corresponding_month?: string;    // Formato 'YYYY-MM'
  is_proportional?: 0 | 1;
  is_refund?: 0 | 1;
  original_invoice_id?: number;
  original_invoice_number?: string | null;
  pdf_path?: string;
  has_attachments?: 0 | 1;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
}

export interface FileAttachment {
  id?: number;
  invoice_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at?: string;
}
