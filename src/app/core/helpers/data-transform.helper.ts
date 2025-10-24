import { Injectable } from '@angular/core';

/**
 * Servicio de transformación genérica de datos
 * Centraliza todas las conversiones y transformaciones de tipos
 * Usado por toda la aplicación para mantener consistencia
 *
 * VENTAJAS:
 * - Nunca retorna null/undefined inesperadamente
 * - Tipado fuerte en entrada y salida
 * - Métodos puros (sin efectos secundarios)
 * - Reutilizable en cualquier entidad
 */
@Injectable({
  providedIn: 'root'
})
export class DataTransformHelper {

  constructor() { }

  // ==========================================================
  // TRANSFORMACIONES NUMÉRICAS
  // ==========================================================

  /**
   * Convierte cualquier valor a número de forma segura
   * @param value - Valor a convertir (unknown para aceptar cualquier cosa)
   * @param defaultValue - Valor por defecto si conversión falla
   * @returns Número convertido o defaultValue
   *
   * EJEMPLOS:
   * parseNumber("123.45") → 123.45
   * parseNumber(null) → 0
   * parseNumber("abc") → 0
   * parseNumber("123", 999) → 123
   */
  parseNumber(value: unknown, defaultValue: number = 0): number {
    if (value === null || value === undefined) return defaultValue;
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * Redondea un número a X decimales
   * @param value - Valor a redondear
   * @param decimals - Cantidad de decimales
   * @returns Número redondeado
   */
  roundNumber(value: unknown, decimals: number = 2): number {
    const num = this.parseNumber(value);
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  // ==========================================================
  // TRANSFORMACIONES BOOLEANAS
  // ==========================================================

  /**
   * Convierte cualquier valor a boolean
   * @param value - Valor a convertir
   * @returns true si es truthy, false si es falsy
   *
   * REGLAS:
   * - "true", 1, true → true
   * - "false", 0, false, null, undefined → false
   * - "1", "yes", "on" → true
   * - "0", "no", "off" → false
   */
  toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      return !['false', '0', 'no', 'off', ''].includes(lower);
    }
    return !!value;
  }

  // ==========================================================
  // TRANSFORMACIONES DE STRINGS
  // ==========================================================

  /**
   * Convierte valor a string, trimea y retorna undefined si está vacío
   * @param value - Valor a convertir
   * @returns String trimado o undefined
   *
   * ÚTIL PARA: Campos opcionales que no queremos guardar vacíos
   */
  trimOrUndefined(value: unknown): string | undefined {
    if (value === null || value === undefined) return undefined;
    const str = String(value).trim();
    return str.length === 0 ? undefined : str;
  }

  /**
   * Convierte a mayúsculas y trimea
   * @param value - Valor a convertir
   * @returns String en mayúsculas o undefined si está vacío
   */
  toUpperCaseAndTrim(value: unknown): string | undefined {
    const trimmed = this.trimOrUndefined(value);
    return trimmed ? trimmed.toUpperCase() : undefined;
  }

  /**
   * Convierte a minúsculas y trimea
   * @param value - Valor a convertir
   * @returns String en minúsculas o undefined si está vacío
   */
  toLowerCaseAndTrim(value: unknown): string | undefined {
    const trimmed = this.trimOrUndefined(value);
    return trimmed ? trimmed.toLowerCase() : undefined;
  }

  /**
   * Remueve todos los espacios de un string
   * @param value - Valor a procesar
   * @returns String sin espacios o undefined
   */
  removeSpaces(value: unknown): string | undefined {
    const trimmed = this.trimOrUndefined(value);
    return trimmed ? trimmed.replace(/\s/g, '') : undefined;
  }

  /**
   * Trunca un texto a longitud máxima con "..."
   * @param value - Texto a truncar
   * @param maxLength - Longitud máxima
   * @returns Texto truncado o "-" si vacío
   */
  truncateText(value: unknown, maxLength: number = 50): string {
    const text = this.trimOrUndefined(value);
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // ==========================================================
  // TRANSFORMACIONES DE FECHAS
  // ==========================================================

  /**
   * Convierte cualquier fecha a formato YYYY-MM-DD para inputs HTML
   * @param dateValue - Fecha en cualquier formato (ISO, timestamp, etc.)
   * @returns Fecha en formato "2025-07-11" o undefined si inválida
   *
   * ÚTIL PARA: Rellenar inputs type="date"
   */
  formatDateForInput(dateValue: unknown): string | undefined {
    if (!dateValue) return undefined;

    const date = new Date(String(dateValue));
    if (isNaN(date.getTime())) return undefined;

    return date.toISOString().split('T')[0];
  }

  /**
   * Obtiene la fecha actual en formato YYYY-MM-DD
   * @returns Fecha actual en formato "2025-07-11"
   */
  getCurrentDateForInput(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Formatea fecha a formato español DD/MM/YYYY
   * @param dateValue - Fecha a formatear
   * @returns Fecha formateada o "-" si inválida
   */
  formatDateLocale(dateValue: unknown): string {
    if (!dateValue) return '-';

    const date = new Date(String(dateValue));
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('es-ES');
  }

  // ==========================================================
  // TRANSFORMACIONES DE OBJETOS
  // ==========================================================

  /**
   * Aplica transformaciones a un objeto completo
   * Útil para preparar datos antes de enviar al backend
   *
   * @param obj - Objeto a transformar
   * @param schema - Esquema de transformaciones
   * @returns Objeto transformado
   *
   * EJEMPLO:
   * ```
   * const transformed = this.transformObject(userData, {
   *   name: 'upperTrim',
   *   email: 'lowerTrim',
   *   age: 'number',
   *   active: 'boolean'
   * });
   * ```
   */
  transformObject<T extends Record<string, unknown>>(
    obj: T,
    schema: Record<keyof T, TransformationType>
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const key in schema) {
      const transformType = schema[key];
      const value = obj[key];

      result[key] = this.applyTransformation(value, transformType);
    }

    return result;
  }

  /**
   * Aplica una transformación individual
   * @param value - Valor a transformar
   * @param type - Tipo de transformación a aplicar
   * @returns Valor transformado
   */
  private applyTransformation(value: unknown, type: TransformationType): unknown {
    switch (type) {
      case 'number':
        return this.parseNumber(value);
      case 'boolean':
        return this.toBoolean(value);
      case 'upperTrim':
        return this.toUpperCaseAndTrim(value);
      case 'lowerTrim':
        return this.toLowerCaseAndTrim(value);
      case 'trim':
        return this.trimOrUndefined(value);
      case 'removeSpaces':
        return this.removeSpaces(value);
      case 'dateInput':
        return this.formatDateForInput(value);
      case 'dateLocale':
        return this.formatDateLocale(value);
      default:
        return value;
    }
  }

  /**
   * Formatea un monto sin símbolo de moneda
   * @param amount - Monto a formatear
   * @returns String con 2 decimales: "123.50"
   */
  formatAmountPlain(amount: unknown): string {
    const num = this.parseNumber(amount);
    return num.toFixed(2);
  };

  /**
   * Formatea un monto con separador de miles
   * @param amount - Monto a formatear
   * @returns String formateado: "1.234,50 €"
   */
  // En DataTransformHelper
  formatAmountLocale(amount: unknown): string {
    const num = this.parseNumber(amount);
    return `${num.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}€`; // Euro al final
  }



}

/**
 * Tipos de transformaciones disponibles
 * Úsalo como referencia al crear esquemas
 */
export type TransformationType =
  | 'number'
  | 'boolean'
  | 'upperTrim'
  | 'lowerTrim'
  | 'trim'
  | 'removeSpaces'
  | 'dateInput'
  | 'dateLocale';
