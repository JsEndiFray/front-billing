import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  ExportConfig,
  JsPDFAutoTableOptions,
  JsPDFInstance,
} from '../../../interfaces/exportar-interface';

@Injectable({
  providedIn: 'root',
})
export class ExportService {

  /**
   * Método principal que muestra el diálogo de selección de formato
   * y ejecuta la exportación según la opción elegida por el usuario
   */
  async exportData<T = Record<string, unknown>>(config: ExportConfig<T>): Promise<void> {
    // Validación: verificar que existan datos para exportar
    if (!config.data || config.data.length === 0) {
      Swal.fire('Sin datos', 'No hay datos para exportar', 'warning');
      return;
    }

    // Mostrar diálogo de selección de formato (Excel o PDF)
    const result = await Swal.fire({
      title: 'Exportar Datos',
      text: 'Selecciona el formato de exportación',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Excel (.xlsx)',
      cancelButtonText: 'PDF',
      showDenyButton: true,
      denyButtonText: 'Cancelar',
      reverseButtons: true,
    });

    // Ejecutar exportación según la opción seleccionada
    if (result.isConfirmed) {
      this.exportToExcel(config);
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      this.exportToPDF(config);
    }
  }

  /**
   * Exporta los datos a formato Excel (.xlsx)
   * Utiliza la librería XLSX para generar el archivo
   */
  private exportToExcel<T = Record<string, unknown>>(config: ExportConfig<T>): void {
    // Transformar los datos según las columnas configuradas
    const excelData = config.data.map((item) => {
      const row: Record<string, unknown> = {};
      config.columns.forEach((column) => {
        // Obtener el valor anidado si existe (ej: 'user.name')
        const value = this.getNestedValue(item, column.key);
        // Aplicar formatter si está definido, sino usar el valor original
        row[column.title] = column.formatter ? column.formatter(value) : value;
      });
      return row;
    });

    // Crear la hoja de cálculo desde los datos JSON
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    // Configurar el ancho de las columnas si está especificado
    if (config.columns.some((col) => col.width)) {
      worksheet['!cols'] = config.columns.map((col) => ({ wch: col.width || 15 }));
    }

    // Agregar la hoja al libro y generar el archivo
    XLSX.utils.book_append_sheet(workbook, worksheet, config.title);
    const fileName = `${config.filename}-${this.getCurrentDate()}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    // Mostrar mensaje de éxito
    this.showSuccessMessage(fileName);
  }

  /**
   * Exporta los datos a formato PDF
   * Utiliza jsPDF con el plugin autoTable para generar tablas
   */
  private exportToPDF<T = Record<string, unknown>>(config: ExportConfig<T>): void {
    // Crear instancia de jsPDF en orientación horizontal y tipar correctamente
    const doc = new jsPDF('landscape') as JsPDFInstance;

    // Configurar título del documento
    doc.setFontSize(16);
    doc.text(config.title, 14, 20);

    // Agregar información de metadata
    doc.setFontSize(10);
    doc.text(`Generado el: ${this.getCurrentDateTime()}`, 14, 30);
    doc.text(`Total de registros: ${config.data.length}`, 14, 35);

    // Preparar los datos de la tabla transformando cada fila
    const tableData = config.data.map((item) =>
      config.columns.map((column) => {
        const value = this.getNestedValue(item, column.key);
        // Aplicar formatter o convertir a string, con fallback a string vacío
        return column.formatter ? column.formatter(value) : value?.toString() || '';
      })
    );

    // Configurar estilos de columnas (alineación)
    const columnStyles: Record<string, { halign: 'left' | 'center' | 'right' }> = {};
    config.columns.forEach((column, index) => {
      if (column.align) {
        columnStyles[index.toString()] = { halign: column.align };
      }
    });

    // Configurar opciones de la tabla
    const autoTableOptions: JsPDFAutoTableOptions = {
      startY: 45, // Posición Y donde inicia la tabla
      head: [config.columns.map((col) => col.title)], // Cabeceras
      body: tableData, // Datos del cuerpo
      styles: { fontSize: 8, cellPadding: 2 }, // Estilos generales
      headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' }, // Estilo de encabezados
      alternateRowStyles: { fillColor: [245, 245, 245] }, // Filas alternadas en gris claro
      columnStyles: columnStyles, // Estilos por columna
    };

    // Generar la tabla en el PDF
    doc.autoTable(autoTableOptions);

    // Guardar el archivo PDF
    const fileName = `${config.filename}-${this.getCurrentDate()}.pdf`;
    doc.save(fileName);

    // Mostrar mensaje de éxito
    this.showSuccessMessage(fileName);
  }

  /**
   * Obtiene valores anidados de un objeto usando notación de punto
   * Ejemplo: getNestedValue(obj, 'user.address.city')
   */
  private getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((current: any, key: string) => {
      return current?.[key];
    }, obj);
  }

  /**
   * Retorna la fecha actual en formato ISO (YYYY-MM-DD)
   */
  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Retorna la fecha y hora actual formateada en español
   * Formato: DD/MM/YYYY HH:MM
   */
  private getCurrentDateTime(): string {
    return new Date().toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  /**
   * Muestra un mensaje de éxito tras la exportación
   * Se cierra automáticamente después de 2 segundos
   */
  private showSuccessMessage(fileName: string): void {
    Swal.fire({
      title: 'Exportación exitosa',
      text: `Archivo ${fileName} descargado`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
    });
  }
}
