import { Injectable } from '@angular/core';
import { DataTransformHelper } from './data-transform.helper';

/**
 * Servicio de validación de documentos españoles
 * Centraliza validaciones de: NIF, NIE, CIF, Pasaporte, Referencia Catastral
 *
 * USA ALGORITMOS OFICIALES de la administración española
 * Reutilizable en: Clientes, Empleados, Propietarios, Proveedores, Facturas
 */
@Injectable({
  providedIn: 'root'
})
export class DocumentValidationHelper {

  constructor(private dataTransform: DataTransformHelper) { }

  // ==========================================================
  // VALIDACIONES DE NIF (Documento Nacional de Identidad)
  // ==========================================================

  /**
   * Valida NIF con algoritmo oficial de letra de control
   * Formato: 8 dígitos + 1 letra (EJEMPLO: 12345678Z)
   *
   * @param nif - NIF a validar
   * @returns true si es válido, false si no
   */
  validateNIF(nif: unknown): boolean {
    const clean = this.dataTransform.toUpperCaseAndTrim(nif);
    if (!clean || clean.length !== 9) return false;

    // Formato: 8 números + 1 letra
    const nifRegex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/;
    if (!nifRegex.test(clean)) return false;

    // Validar letra de control con algoritmo oficial
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const number = parseInt(clean.substring(0, 8), 10);
    const letter = clean.charAt(8);

    return letter === letters.charAt(number % 23);
  }

  // ==========================================================
  // VALIDACIONES DE NIE (Número de Identidad de Extranjero)
  // ==========================================================

  /**
   * Valida NIE con conversión a NIF equivalente
   * Formato: 1 letra (X, Y, Z) + 7 dígitos + 1 letra (EJEMPLO: X1234567Z)
   *
   * @param nie - NIE a validar
   * @returns true si es válido, false si no
   */
  validateNIE(nie: unknown): boolean {
    const clean = this.dataTransform.toUpperCaseAndTrim(nie);
    if (!clean || clean.length !== 9) return false;

    // Formato: X/Y/Z + 7 números + 1 letra
    const nieRegex = /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/;
    if (!nieRegex.test(clean)) return false;

    // Convertir a número equivalente según algoritmo oficial
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    let number = clean.substring(1, 8);

    // X → 0, Y → 1, Z → 2
    if (clean.charAt(0) === 'Y') number = '1' + number;
    else if (clean.charAt(0) === 'Z') number = '2' + number;
    else number = '0' + number;

    const letter = clean.charAt(8);
    return letter === letters.charAt(parseInt(number, 10) % 23);
  }

  // ==========================================================
  // VALIDACIONES DE CIF (Código de Identificación Fiscal)
  // ==========================================================

  /**
   * Calcula dígito de control para CIF usando algoritmo oficial
   * Algoritmo Luhn modificado
   *
   * @param number - 7 dígitos de la empresa
   * @returns Dígito de control (0-9)
   */
  private calculateCIFControl(number: string): number {
    let sum = 0;

    for (let i = 0; i < number.length; i++) {
      let digit = parseInt(number.charAt(i), 10);

      // Posiciones pares (0, 2, 4...) se multiplican por 2
      if (i % 2 === 0) {
        digit *= 2;
        // Si el resultado es > 9, sumamos sus dígitos
        if (digit > 9) {
          digit = Math.floor(digit / 10) + (digit % 10);
        }
      }

      sum += digit;
    }

    // El dígito de control es: 10 - (suma mod 10)
    return (10 - (sum % 10)) % 10;
  }

  /**
   * Valida CIF para empresas con algoritmo de dígito de control
   * Formato: 1 letra + 7 dígitos + 1 dígito/letra de control (EJEMPLO: A12345674)
   *
   * @param cif - CIF a validar
   * @returns true si es válido, false si no
   */
  validateCIF(cif: unknown): boolean {
    const clean = this.dataTransform.toUpperCaseAndTrim(cif);
    if (!clean || clean.length !== 9) return false;

    // Formato: A-W (excepto I, O, Ñ, S, Q, U) + 7 números + dígito/letra
    const cifRegex = /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/;
    if (!cifRegex.test(clean)) return false;

    // Calcular dígito esperado
    const number = clean.substring(1, 8);
    const control = clean.charAt(8);
    const expectedControl = this.calculateCIFControl(number);

    // El dígito puede ser número o letra (JABCDEFGHI)
    const letters = 'JABCDEFGHI';
    const expectedLetter = letters.charAt(expectedControl);

    return control === expectedControl.toString() || control === expectedLetter;
  }

  // ==========================================================
  // VALIDACIONES DE PASAPORTE
  // ==========================================================

  /**
   * Valida formato de pasaporte español
   * Formato: 8 caracteres alfanuméricos (EJEMPLO: ABC123456)
   *
   * @param passport - Pasaporte a validar
   * @returns true si es válido, false si no
   */
  validatePassport(passport: unknown): boolean {
    const clean = this.dataTransform.toUpperCaseAndTrim(passport);
    if (!clean || clean.length !== 8) return false;

    // Pasaportes españoles: 8 caracteres alfanuméricos
    const passportRegex = /^[A-Z0-9]{8}$/;
    return passportRegex.test(clean);
  }

  // ==========================================================
  // VALIDACIONES DE REFERENCIA CATASTRAL
  // ==========================================================

  /**
   * Valida formato de referencia catastral española
   * Formato: 20 caracteres alfanuméricos (EJEMPLO: 1234567AB1234567ABC0)
   *
   * @param refCat - Referencia catastral a validar
   * @returns true si tiene formato válido, false si no
   */
  validateCadastralReferenceFormat(refCat: unknown): boolean {
    const clean = this.dataTransform.toUpperCaseAndTrim(refCat);
    if (!clean || clean.length !== 20) return false;

    // 20 caracteres alfanuméricos
    return /^[0-9A-Z]{20}$/i.test(clean);
  }

  /**
   * Valida existencia real de referencia catastral consultando backend
   * NOTA: Este es un método asíncrono que consulta el servidor
   *
   * @param refCat - Referencia catastral a verificar
   * @returns Promise con validación
   */
  async validateCadastralReferenceExists(refCat: unknown): Promise<{ isValid: boolean; message?: string }> {
    // 1. Validar formato localmente primero
    if (!this.validateCadastralReferenceFormat(refCat)) {
      return {
        isValid: false,
        message: 'La referencia catastral debe tener exactamente 20 caracteres alfanuméricos'
      };
    }

    // 2. Consultar backend (que consulta el Catastro)
    try {
      const clean = this.dataTransform.toUpperCaseAndTrim(refCat);
      const response = await fetch(`/api/cadastral/validate/${clean}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Error validando referencia catastral:', error);
      return {
        isValid: true,
        message: 'Formato válido. No se pudo verificar existencia (problema de conexión)'
      };
    }
  }

  // ==========================================================
  // VALIDACIÓN INTELIGENTE POR TIPO DE DOCUMENTO
  // ==========================================================

  /**
   * Valida identificación automáticamente según tipo
   * Para PERSONAS: acepta NIF, NIE o Pasaporte
   * Para EMPRESAS: requiere CIF
   *
   * @param identification - Documento a validar
   * @param entityType - Tipo de entidad ('person' | 'company')
   * @returns Objeto con validación y mensaje
   */
  validateIdentification(
    identification: unknown,
    entityType: 'person' | 'company' = 'person'
  ): { isValid: boolean; message?: string } {
    if (!identification) {
      return { isValid: false, message: 'La identificación es obligatoria' };
    }

    const clean = this.dataTransform.toUpperCaseAndTrim(identification);
    if (!clean) {
      return { isValid: false, message: 'La identificación no puede estar vacía' };
    }

    // Validación para empresas
    if (entityType === 'company') {
      if (!this.validateCIF(clean)) {
        return { isValid: false, message: 'El CIF no tiene un formato válido' };
      }
      return { isValid: true };
    }

    // Validación para personas: NIF, NIE o Pasaporte
    const isValidNIF = this.validateNIF(clean);
    const isValidNIE = this.validateNIE(clean);
    const isValidPassport = this.validatePassport(clean);

    if (!isValidNIF && !isValidNIE && !isValidPassport) {
      return {
        isValid: false,
        message: 'Debe ser un NIF, NIE o Pasaporte válido'
      };
    }

    return { isValid: true };
  }

  // ==========================================================
  // UTILIDADES
  // ==========================================================

  /**
   * Genera un CIF válido para testing
   * SOLO para desarrollo/testing, nunca usar en producción
   *
   * @returns CIF válido generado aleatoriamente
   */
  generateValidCIFForTesting(): string {
    const letters = 'ABCDEFGHJNPQRSUVW';
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const numbers = Math.floor(Math.random() * 9000000) + 1000000; // 7 dígitos

    const control = this.calculateCIFControl(numbers.toString());
    const controlChar = 'JABCDEFGHI'[control];

    return `${letter}${numbers}${controlChar}`;
  }

  /**
   * Obtiene tipo de documento basado en su formato
   *
   * @param document - Documento a analizar
   * @returns Tipo: 'NIF' | 'NIE' | 'CIF' | 'PASSPORT' | 'UNKNOWN'
   */
  getDocumentType(document: unknown): 'NIF' | 'NIE' | 'CIF' | 'PASSPORT' | 'UNKNOWN' {
    const clean = this.dataTransform.toUpperCaseAndTrim(document);
    if (!clean) return 'UNKNOWN';

    if (this.validateNIF(clean)) return 'NIF';
    if (this.validateNIE(clean)) return 'NIE';
    if (this.validateCIF(clean)) return 'CIF';
    if (this.validatePassport(clean)) return 'PASSPORT';

    return 'UNKNOWN';
  }

}
