//listado y registro de inmuebles
export interface Estates {
  id?: number | null;
  cadastral_reference: string;
  price: number | null;
  address: string;
  postal_code: string;
  location: string;
  province: string;
  country: string;
  surface: number | null;
  date_create?: string;
  date_update?: string;
}
