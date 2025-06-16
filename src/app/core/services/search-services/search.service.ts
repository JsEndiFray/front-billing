import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  /**
   * Función simple para filtrar cualquier array de datos
   * @param data - Array de datos a filtrar
   * @param searchTerm - Término de búsqueda
   * @param fields - Array con los nombres de los campos donde buscar
   * @returns Array filtrado
   */
  filterData<T>(data: T[], searchTerm: string, fields: (keyof T)[]): T[] {
    // Si no hay término de búsqueda, devolver todos los datos
    if (!searchTerm || searchTerm.trim() === '') {
      return [...data];
    }

    const searchTermLower = searchTerm.toLowerCase().trim();

    return data.filter(item => {
      // Buscar en cada campo especificado
      return fields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(searchTermLower);
      });
    });
  }

  /**
   * Función específica para buscar en nombre completo (nombre + apellido)
   * @param data - Array de datos a filtrar
   * @param searchTerm - Término de búsqueda
   * @param nameField - Campo del nombre
   * @param lastNameField - Campo del apellido
   * @param otherFields - Otros campos donde buscar
   * @returns Array filtrado
   */
  filterWithFullName<T>(
    data: T[],
    searchTerm: string,
    nameField: keyof T,
    lastNameField: keyof T,
    otherFields: (keyof T)[] = []
  ): T[] {
    // Si no hay término de búsqueda, devolver todos los datos
    if (!searchTerm || searchTerm.trim() === '') {
      return [...data];
    }

    const searchTermLower = searchTerm.toLowerCase().trim();

    return data.filter(item => {
      // Crear nombre completo
      const name = item[nameField] || '';
      const lastName = item[lastNameField] || '';
      const fullName = `${name} ${lastName}`.toLowerCase();

      // Verificar si encuentra en nombre completo
      if (fullName.includes(searchTermLower)) {
        return true;
      }

      // Verificar en otros campos
      return otherFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(searchTermLower);
      });
    });
  }
}
