/**
 * Helper para gestionar tipos y etiquetas de IVA
 * Centraliza la lógica de formateo de porcentajes de IVA
 *
 * USO:
 * const label = VatRatesHelper.getLabel(21); // 'General (21%)'
 */
export class VatRatesHelper {

  /**
   * Obtiene la etiqueta descriptiva para un tipo de IVA
   * @param rate - Porcentaje de IVA (0, 4, 10, 21, etc.)
   * @returns Etiqueta formateada
   */
  static getLabel(rate: number | undefined): string {
    const num = Number(rate) || 0;

    switch(num) {
      case 21:
        return 'General (21%)';
      case 10:
        return 'Reducido (10%)';
      case 4:
        return 'Superreducido (4%)';
      case 0:
        return 'Exento';
      default:
        return `${num}%`;
    }
  }

  /**
   * Valida si un porcentaje de IVA es válido en España
   * @param rate - Porcentaje a validar
   * @returns true si es un tipo de IVA válido
   */
  static isValidRate(rate: number): boolean {
    return [0, 4, 10, 21].includes(rate);
  }

  /**
   * Obtiene todos los tipos de IVA disponibles
   * @returns Array con los tipos de IVA y sus etiquetas
   */
  static getAllRates() {
    return [
      { rate: 21, label: 'General (21%)' },
      { rate: 10, label: 'Reducido (10%)' },
      { rate: 4, label: 'Superreducido (4%)' },
      { rate: 0, label: 'Exento' }
    ];
  }
}
