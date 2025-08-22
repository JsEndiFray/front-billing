/**
 * Interface para propiedades inmobiliarias
 */
export interface Estates {
  id?: number | null;
  cadastral_reference: string;           // Referencia catastral española (20 caracteres)
  price: number | null;
  address: string;
  postal_code: string;
  location: string;
  province: string;
  country: string;
  surface: number | null;                 // Superficie en m²
  date_create?: string;
  date_update?: string;
}
