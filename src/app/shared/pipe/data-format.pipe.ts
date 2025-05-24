import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'dataFormat'
})
export class DataFormatPipe implements PipeTransform {

  transform(value: string | undefined): string {
    if (!value) {
      return '';
    }
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
