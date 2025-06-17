import {Pipe, PipeTransform} from '@angular/core';

/**
 * Pipe para formatear fechas en español
 * Uso: {{ fecha | dataFormat }}
 * Resultado: "17/06/2025, 14:30:25"
 */
@Pipe({
  name: 'dataFormat',
  standalone: true
})
export class DataFormatPipe implements PipeTransform {

  transform(value: string | undefined): string {
    if (!value) {
      return '';
    }

    // Convierte string a fecha y formatea en español
    const date = new Date(value);
    return date.toLocaleString('es-Es', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
}
