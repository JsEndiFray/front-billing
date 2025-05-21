export interface Bills {
  id: number;
  bill_number: string;
  estate_id: number |null;
  clients_id: number |null;
  owners_id: number |null;
  date: string;
  tax_base: number |null;
  iva: number |null;
  irpf: number |null;
  total: number |null;
}
//este interface es para la lista de facturas
export interface BillsList {
  id: number;
  bill_number: string;
  property: string;
  clients: string;
  owners: string;
  ownership_percent: number | null;
  date: string;
  tax_base: number | null;
  iva: number | null;
  irpf: number | null;
  total: number | null;
}
