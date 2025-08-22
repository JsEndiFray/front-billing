import { Injectable } from '@angular/core';
import {PaginationConfig, PaginationResult} from '../../../interfaces/pagination-interface';


/**
 * Servicio para manejar paginación de arrays
 * Funciones genéricas reutilizables para cualquier tipo de datos
 */
@Injectable({
  providedIn: 'root'
})
export class PaginationService {

  /**
   * Pagina un array de datos
   * @param data Array completo de datos
   * @param config Configuración de paginación
   * @returns Resultado con datos paginados e información
   */
  paginate<T>(data: T[], config: PaginationConfig): PaginationResult<T> {
    const { currentPage, itemsPerPage, totalItems } = config;

    // Calcular índices
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // Obtener elementos de la página actual
    const items = data.slice(startIndex, endIndex);

    // Calcular información adicional
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const hasNext = currentPage < totalPages;
    const hasPrevious = currentPage > 1;

    return {
      items,
      totalPages,
      hasNext,
      hasPrevious,
      startIndex: startIndex + 1, // Para mostrar "1-5" en lugar de "0-4"
      endIndex: Math.min(endIndex, totalItems)
    };
  }

  /**
   * Calcula el total de páginas
   * @param totalItems Total de elementos
   * @param itemsPerPage Elementos por página
   * @returns Número total de páginas
   */
  calculateTotalPages(totalItems: number, itemsPerPage: number): number {
    return Math.ceil(totalItems / itemsPerPage);
  }

  /**
   * Valida si una página es válida
   * @param page Número de página
   * @param totalPages Total de páginas
   * @returns True si la página es válida
   */
  isValidPage(page: number, totalPages: number): boolean {
    return page >= 1 && page <= totalPages && totalPages > 0;
  }

  /**
   * Genera array de números de página para mostrar
   * @param currentPage Página actual
   * @param totalPages Total de páginas
   * @param maxVisible Máximo de páginas visibles
   * @returns Array de números de página
   */
  getVisiblePages(currentPage: number, totalPages: number, maxVisible: number = 5): number[] {
    if (totalPages <= maxVisible) {
      // Mostrar todas las páginas si son pocas
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);

    // Ajustar si estamos cerca del final
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  /**
   * Obtiene información de texto para mostrar
   * @param config Configuración de paginación
   * @param actualItems Elementos reales mostrados
   * @returns Texto informativo (ej: "Mostrando 1-5 de 50")
   */
  getPaginationText(config: PaginationConfig, actualItems: number): string {
    const { currentPage, itemsPerPage, totalItems } = config;

    if (totalItems === 0) {
      return 'No hay elementos';
    }

    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = startIndex + actualItems - 1;

    return `Mostrando ${startIndex}-${endIndex} de ${totalItems}`;
  }
}
