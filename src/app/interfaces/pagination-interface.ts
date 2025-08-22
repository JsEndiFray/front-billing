/**
 * Interface para configuración de paginación
 */
export interface PaginationConfig {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

/**
 * Interface para resultado de paginación
 */
export interface PaginationResult<T> {
  items: T[];
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  startIndex: number;
  endIndex: number;
}
