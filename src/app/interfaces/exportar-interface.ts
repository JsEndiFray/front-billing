import jsPDF from 'jspdf';
import { UserOptions } from 'jspdf-autotable';

/**
 * Configuración para exportación
 */
export interface ExportConfig<T = Record<string, unknown>> {
  filename: string;  // Nombre base del archivo (sin extensión ni fecha)
  title: string;     // Título que aparece en el documento
  columns: ExportColumn[]; // Configuración de columnas a exportar
  data: T[];         // Array de datos a exportar
}

/**
 * Configuración de columna para exportación
 */
export interface ExportColumn {
  key: string;           // Clave del objeto de datos (soporta anidación: 'user.name')
  title: string;         // Título de la columna en el documento exportado
  width?: number;        // Ancho para Excel (en caracteres)
  formatter?: (value: unknown) => string; // Función para formatear el valor antes de exportar
  align?: 'left' | 'center' | 'right';    // Alineación para PDF
}

/**
 * Extiende la interfaz oficial de jsPDF para incluir el método del plugin autoTable.
 * Esto permite que TypeScript reconozca el método autoTable añadido por el plugin.
 */
export interface JsPDFInstance extends jsPDF {
  autoTable: (options: UserOptions) => void;
}

/**
 * Usa el tipo oficial 'UserOptions' de jspdf-autotable
 * Esto garantiza compatibilidad total con todas las opciones disponibles del plugin
 */
export type JsPDFAutoTableOptions = UserOptions;
