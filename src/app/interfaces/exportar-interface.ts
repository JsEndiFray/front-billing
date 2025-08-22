/**
 * Configuración para exportación
 */
export interface ExportConfig<T = Record<string, unknown>> {
  filename: string;
  title: string;
  columns: ExportColumn[];
  data: T[];
}

/**
 * Configuración de columna para exportación
 */
export interface ExportColumn {
  key: string;           // Clave del objeto de datos
  title: string;         // Título de la columna
  width?: number;        // Ancho para Excel
  formatter?: (value: unknown) => string; // Función para formatear el valor
  align?: 'left' | 'center' | 'right'; // Alineación para PDF
}

/**
 * Interface para jsPDF
 */
 export interface JsPDFInstance {
  setFontSize: (size: number) => void;
  text: (text: string, x: number, y: number) => void;
  autoTable: (options: JsPDFAutoTableOptions) => void;
  save: (filename: string) => void;
}

/**
 * Interface para opciones de autoTable
 */
 export interface JsPDFAutoTableOptions {
  startY: number;
  head: string[][];
  body: string[][];
  styles: Record<string, unknown>;
  headStyles: Record<string, unknown>;
  alternateRowStyles: Record<string, unknown>;
  columnStyles: Record<number, { halign: string }>;
}

/**
 * Interface para el require de jsPDF
 */
 export interface JsPDFRequire {
  jsPDF: new (orientation?: string) => JsPDFInstance;
}
