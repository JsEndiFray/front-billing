import {InvoiceReceived} from './invoices-received-interface';


export interface Suppliers {
  id?: number;
  name?: string;
  company_name?: string | null;
  tax_id?: string | null;
  address?: string;
  postal_code?: string;
  city?: string;
  province?: string;
  country?: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  payment_terms?: number;
  bank_account?: string;
  notes?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface para la respuesta del servidor
 */
export interface CreateInvoiceResponse {
  message: string;
  invoice: InvoiceReceived;
}
