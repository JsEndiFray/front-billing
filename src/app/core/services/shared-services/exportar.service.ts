import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import {ExportConfig, JsPDFAutoTableOptions, JsPDFInstance} from '../../../interfaces/exportar-interface';




@Injectable({
  providedIn: 'root'
})
export class ExportService {

  /**
   * Muestra modal para elegir formato y exporta
   */
  async exportData<T = Record<string, unknown>>(config: ExportConfig<T>): Promise<void> {
    if (!config.data || config.data.length === 0) {
      Swal.fire('Sin datos', 'No hay datos para exportar', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: 'Exportar Datos',
      text: 'Selecciona el formato de exportación',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Excel (.xlsx)',
      cancelButtonText: 'PDF',
      showDenyButton: true,
      denyButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      this.exportToExcel(config);
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      this.exportToPDF(config);
    }
  }

  /**
   * Exporta a Excel usando la configuración proporcionada
   */
  private exportToExcel<T = Record<string, unknown>>(config: ExportConfig<T>): void {
    // Preparar datos usando la configuración de columnas
    const excelData = config.data.map(item => {
      const row: Record<string, unknown> = {};
      config.columns.forEach(column => {
        const value = this.getNestedValue(item, column.key);
        row[column.title] = column.formatter ? column.formatter(value) : value;
      });
      return row;
    });

    // Crear hoja de Excel
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    // Configurar anchos de columna si están especificados
    if (config.columns.some(col => col.width)) {
      worksheet['!cols'] = config.columns.map(col => ({ wch: col.width || 15 }));
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, config.title);

    // Generar nombre de archivo
    const fileName = `${config.filename}-${this.getCurrentDate()}.xlsx`;

    // Descargar
    XLSX.writeFile(workbook, fileName);

    this.showSuccessMessage(fileName);
  }

  /**
   * Exporta a PDF usando la configuración proporcionada
   */
  private exportToPDF<T = Record<string, unknown>>(config: ExportConfig<T>): void {
    const { jsPDF } = require('jspdf');
    require('jspdf-autotable');

    const doc: JsPDFInstance = new jsPDF('landscape');

    doc.setFontSize(16);
    doc.text(config.title, 14, 20);

    doc.setFontSize(10);
    doc.text(`Generado el: ${this.getCurrentDateTime()}`, 14, 30);
    doc.text(`Total de registros: ${config.data.length}`, 14, 35);

    const tableData = config.data.map(item =>
      config.columns.map(column => {
        const value = this.getNestedValue(item, column.key);
        return column.formatter ? column.formatter(value) : (value?.toString() || '');
      })
    );

    const columnStyles: Record<number, { halign: string }> = {};
    config.columns.forEach((column, index) => {
      if (column.align) {
        columnStyles[index] = { halign: column.align };
      }
    });

    const autoTableOptions: JsPDFAutoTableOptions = {
      startY: 45,
      head: [config.columns.map(col => col.title)],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: columnStyles
    };

    doc.autoTable(autoTableOptions);

    const fileName = `${config.filename}-${this.getCurrentDate()}.pdf`;
    doc.save(fileName);

    this.showSuccessMessage(fileName);
  }

  /**
   * Obtiene valor anidado de un objeto usando notación de puntos
   */
  private getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * Obtiene fecha actual en formato YYYY-MM-DD
   */
  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Obtiene fecha y hora actual formateada
   */
  private getCurrentDateTime(): string {
    return new Date().toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Muestra mensaje de éxito
   */
  private showSuccessMessage(fileName: string): void {
    Swal.fire({
      title: 'Exportación exitosa',
      text: `Archivo ${fileName} descargado`,
      icon: 'success',
      timer: 2000
    });
  }
}
