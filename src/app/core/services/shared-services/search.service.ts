import {Injectable} from '@angular/core';

/**
 * Servicio utilitario para filtrado y búsqueda en arrays
 * Funciones genéricas reutilizables para cualquier tipo de datos
 */
@Injectable({
  providedIn: 'root'
})
export class SearchService {

  /**
   * Filtra array por término de búsqueda en campos específicos
   * @param data Array de datos a filtrar
   * @param searchTerm Término de búsqueda
   * @param fields Campos donde buscar
   * @returns Array filtrado
   */
  filterData<T>(data: T[], searchTerm: string, fields: (keyof T)[]): T[] {
    if (!searchTerm || searchTerm.trim() === '') {
      return [...data];
    }

    const searchTermLower = searchTerm.toLowerCase().trim();

    return data.filter(item => {
      return fields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(searchTermLower);
      });
    });
  }

  /**
   * Filtra con búsqueda en nombre completo (nombre + apellido)
   * @param data Array de datos a filtrar
   * @param searchTerm Término de búsqueda
   * @param nameField Campo del nombre
   * @param lastNameField Campo del apellido
   * @param otherFields Otros campos donde buscar
   * @returns Array filtrado
   */
  filterWithFullName<T>(
    data: T[],
    searchTerm: string,
    nameField: keyof T,
    lastNameField: keyof T,
    otherFields: (keyof T)[] = []
  ): T[] {
    if (!searchTerm || searchTerm.trim() === '') {
      return [...data];
    }

    const searchTermLower = searchTerm.toLowerCase().trim();

    return data.filter(item => {
      // Buscar en nombre completo
      const name = item[nameField] || '';
      const lastName = item[lastNameField] || '';
      const fullName = `${name} ${lastName}`.toLowerCase();

      if (fullName.includes(searchTermLower)) {
        return true;
      }

      // Buscar en otros campos
      return otherFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(searchTermLower);
      });
    });
  }
}
