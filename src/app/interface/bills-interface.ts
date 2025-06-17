/**
 * Interface para facturas - datos base
 */
export interface Bills {
  id: number;
  bill_number: string;
  estate_id: number | null;
  clients_id: number | null;
  owners_id: number | null;
  date: string;
  tax_base: number | null;
  iva: number | null;
  irpf: number | null;
  total: number | null;
}

/**
 * Interface para lista de facturas con nombres relacionados
 */
export interface BillsList {
  id: number;
  bill_number: string;
  property: string;           // Nombre de propiedad (en lugar de estate_id)
  clients: string;            // Nombre de cliente (en lugar de clients_id)
  owners: string;             // Nombre de propietario (en lugar de owners_id)
  ownership_percent: number | null;
  date: string;
  tax_base: number | null;
  iva: number | null;
  irpf: number | null;
  total: number | null;
}
