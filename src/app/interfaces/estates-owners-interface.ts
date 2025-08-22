/**
 * Interface para relaciones propiedad-propietario con porcentajes
 */
export interface EstatesOwners {
  id?: number | null;
  estate_id?: number | null;
  estate_name?: string;                   // Para display (nombre de propiedad)
  owners_id?: number | null;
  owner_name?: string;                    // Para display (nombre de propietario)
  ownership_percentage?: number | null;   // Porcentaje de propiedad (0-100)
  date_create?: string;
  date_update?: string;
}
