/**
 * Interface para propietarios de inmuebles
 */
export interface Owners {
  id?: number;
  name: string;
  lastname: string;
  email: string;
  identification: string;                 // NIF/NIE/Pasaporte
  phone: string;
  address: string;
  postal_code: string;
  location: string;
  province: string;
  country: string;
  date_create?: string;
  date_update?: string;
}
