export interface InvoiceReceived {
  id?: number;
  invoice_number?: string;
  our_reference?: string;
  supplier_id?: number;
  property_id?: number;
  invoice_date?: string;           // Formato 'YYYY-MM-DD'
  due_date?: string;
  received_date?: string;
  tax_base?: number;
  iva_percentage?: number;
  iva_amount?: number;
  irpf_percentage?: number;
  irpf_amount?: number;
  total_amount?: number;
  category?: 'electricidad' | 'gas' | 'agua' | 'comunidad' | 'seguro' | 'residuos' | 'mantenimiento' | 'reparaciones' | 'materiales' | 'otros';
  subcategory?: string;
  description?: string;
  notes?: string;
  payment_status?: 'pending' | 'paid' | 'overdue' | 'disputed';
  payment_method?: 'transfer' | 'direct_debit' | 'cash' | 'card' | 'check';
  payment_date?: string;
  payment_reference?: string;
  payment_notes?: string;
  start_date?: string;
  end_date?: string;
  corresponding_month?: string;    // Formato 'YYYY-MM'
  is_proportional?: 0 | 1;
  is_refund?: 0 | 1;
  original_invoice_id?: number;
  pdf_path?: string;
  has_attachments?: 0 | 1;
  created_at?: string;
  updated_at?: string;
  created_by?: number;



}
