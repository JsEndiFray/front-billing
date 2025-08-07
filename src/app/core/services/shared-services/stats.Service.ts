import { Injectable } from '@angular/core';
import {Clients} from '../../../interface/clientes-interface';

/**
 * Servicio para calcular estadísticas de arrays de datos
 * Funciones genéricas reutilizables para cualquier entidad
 */
@Injectable({
  providedIn: 'root'
})
export class StatsService {

  /**
   * Calcula estadísticas básicas de un array
   * @param data Array de datos
   * @returns Objeto con estadísticas básicas
   */
  calculateBasicStats<T>(data: T[]): { total: number } {
    return {
      total: data.length
    };
  }

  /**
   * Calcula estadísticas de clientes
   * @param clients Array de clientes
   * @returns Estadísticas específicas de clientes
   */
  calculateClientStats(clients: Clients[]): {
    total: number;
    active: number;
    administrators: number;
    companies: number;
  } {
    const total = clients.length;

    // Por ahora todos son activos (sin campo status)
    const active = total;

    // Contar administradores (autónomos con empresa)
    const administrators = clients.filter(client =>
      client.type_client === 'autonomo' && client.parent_company_id
    ).length;

    // Contar empresas
    const companies = clients.filter(client =>
      client.type_client === 'empresa'
    ).length;

    return {
      total,
      active,
      administrators,
      companies
    };
  }

  /**
   * Cuenta elementos por un campo específico
   * @param data Array de datos
   * @param field Campo a contar
   * @returns Objeto con conteos por valor
   */
  countByField<T>(data: T[], field: keyof T): Record<string, number> {
    const counts: Record<string, number> = {};

    data.forEach(item => {
      const value = String(item[field] || 'undefined');
      counts[value] = (counts[value] || 0) + 1;
    });

    return counts;
  }

  /**
   * Filtra y cuenta elementos que cumplen una condición
   * @param data Array de datos
   * @param condition Función de condición
   * @returns Número de elementos que cumplen la condición
   */
  countByCondition<T>(data: T[], condition: (item: T) => boolean): number {
    return data.filter(condition).length;
  }
}
