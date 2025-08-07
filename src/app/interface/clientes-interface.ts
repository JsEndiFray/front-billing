/**
 * Interface para clientes con relaciones empresa-administrador
 */
export interface Clients {
  id?: number | null;
  type_client: string;                    // 'particular', 'autonomo', 'empresa'
  name: string;
  lastname: string;
  company_name?: string;                  // Requerido para type_client = 'empresa'
  identification: string;                 // NIF/NIE/CIF según tipo
  phone: string;
  email: string;
  address: string;
  postal_code: string;
  location: string;
  province: string;
  country: string;
  date_create?: string;
  date_update?: string;

  // Campos para relación empresa-administrador
  parent_company_id?: number | null;      // ID de empresa padre
  relationship_type?: 'administrator';    // Tipo de relación
  parent_company_name?: string;           // Nombre de empresa padre (para display)
}

export const CLIENT_TYPE_LABELS = {
  particular: 'Particular',
  autonomo: 'Autonomo',
  empresa: 'Empresa'

}
