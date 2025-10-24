import { Injectable } from '@angular/core';
import {AbstractControl, FormGroup, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import { DataTransformHelper } from './data-transform.helper';

/**
 * Servicio de validación de formularios
 * Centraliza validaciones básicas y genéricas para toda la aplicación
 *
 * INCLUYE:
 * - Validaciones básicas: Email, Phone, PostalCode, Percentage
 * - Validadores de Angular tipados correctamente
 * - Mensajes de error centralizados
 * - Validadores cruzados para FormGroups
 */
@Injectable({
  providedIn: 'root'
})
export class FormValidationHelper {

  constructor(private dataTransform: DataTransformHelper) { }

  // ==========================================================
  // VALIDACIONES BÁSICAS (Retornan objeto con validación)
  // ==========================================================

  /**
   * Valida formato de email
   * @param email - Email a validar
   * @returns Objeto con validación y mensaje de error
   */
  validateEmail(email: unknown): { isValid: boolean; message?: string } {
    if (!email) {
      return { isValid: false, message: 'El email es obligatorio' };
    }

    const clean = this.dataTransform.trimOrUndefined(email);
    if (!clean) {
      return { isValid: false, message: 'El email no puede estar vacío' };
    }

    // RFC 5322 simplificado (válido para 99% de casos)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clean)) {
      return { isValid: false, message: 'El formato del email no es válido' };
    }

    return { isValid: true };
  }

  /**
   * Valida número de teléfono español
   * Acepta formatos: 612345678, 612 345 678, +34612345678, etc.
   *
   * @param phone - Teléfono a validar
   * @returns Objeto con validación y mensaje de error
   */
  validatePhone(phone: unknown): { isValid: boolean; message?: string } {
    if (!phone) {
      return { isValid: false, message: 'El teléfono es obligatorio' };
    }

    const clean = this.dataTransform.removeSpaces(phone);
    if (!clean) {
      return { isValid: false, message: 'El teléfono no puede estar vacío' };
    }

    // Teléfonos españoles: +34 o 34 + 6-9 + 8 dígitos, o directo 6-9 + 8 dígitos
    const phoneRegex = /^(\+?34|0034)?[6-9]\d{8}$/;
    if (!phoneRegex.test(clean)) {
      return {
        isValid: false,
        message: 'El teléfono debe tener 9 dígitos y empezar por 6, 7, 8 o 9'
      };
    }

    return { isValid: true };
  }

  /**
   * Valida código postal español
   * Formato: 5 dígitos (EJEMPLO: 28001)
   *
   * @param postalCode - Código postal a validar
   * @returns Objeto con validación y mensaje de error
   */
  validatePostalCode(postalCode: unknown): { isValid: boolean; message?: string } {
    if (!postalCode) {
      return { isValid: false, message: 'El código postal es obligatorio' };
    }

    const clean = this.dataTransform.removeSpaces(postalCode);
    if (!clean) {
      return { isValid: false, message: 'El código postal no puede estar vacío' };
    }

    const postalRegex = /^[0-9]{5}$/;
    if (!postalRegex.test(clean)) {
      return { isValid: false, message: 'El código postal debe tener 5 dígitos' };
    }

    return { isValid: true };
  }

  /**
   * Valida porcentajes (0-100)
   * @param value - Valor a validar
   * @param fieldName - Nombre del campo para mensajes
   * @returns Objeto con validación y mensaje de error
   */
  validatePercentage(
    value: unknown,
    fieldName: string = 'porcentaje'
  ): { isValid: boolean; message?: string } {
    if (value === null || value === undefined) {
      return { isValid: false, message: `El ${fieldName} es obligatorio` };
    }

    const num = this.dataTransform.parseNumber(value);
    if (num === 0 && value !== 0 && value !== '0') {
      // Si parseNumber retornó 0 por defecto (conversión fallida)
      return { isValid: false, message: `El ${fieldName} debe ser un número válido` };
    }

    if (num < 0) {
      return { isValid: false, message: `El ${fieldName} no puede ser negativo` };
    }

    if (num > 100) {
      return { isValid: false, message: `El ${fieldName} no puede exceder 100%` };
    }

    return { isValid: true };
  }

  /**
   * Valida rango numérico
   * @param value - Valor a validar
   * @param min - Valor mínimo
   * @param max - Valor máximo
   * @param fieldName - Nombre del campo para mensajes
   * @returns Objeto con validación y mensaje de error
   */
  validateNumberRange(
    value: unknown,
    min: number,
    max: number,
    fieldName: string = 'número'
  ): { isValid: boolean; message?: string } {
    if (value === null || value === undefined) {
      return { isValid: false, message: `El ${fieldName} es obligatorio` };
    }

    const num = this.dataTransform.parseNumber(value);
    if (num === 0 && value !== 0 && value !== '0') {
      return { isValid: false, message: `El ${fieldName} debe ser un número válido` };
    }

    if (num < min) {
      return { isValid: false, message: `El ${fieldName} debe ser mayor a ${min}` };
    }

    if (num > max) {
      return { isValid: false, message: `El ${fieldName} debe ser menor a ${max}` };
    }

    return { isValid: true };
  }

  /**
   * Valida rango de fechas
   * @param startDate - Fecha inicio
   * @param endDate - Fecha fin
   * @returns Objeto con validación y mensaje de error
   */
  validateDateRange(
    startDate: unknown,
    endDate: unknown
  ): { isValid: boolean; message?: string } {
    if (!startDate && !endDate) {
      return { isValid: true }; // Ambas vacías es válido
    }

    if (startDate && endDate) {
      const start = new Date(String(startDate));
      const end = new Date(String(endDate));

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { isValid: false, message: 'Las fechas no tienen un formato válido' };
      }

      if (start > end) {
        return {
          isValid: false,
          message: 'La fecha inicial no puede ser posterior a la fecha final'
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Valida longitud de string
   * @param value - String a validar
   * @param min - Longitud mínima
   * @param max - Longitud máxima
   * @param fieldName - Nombre del campo para mensajes
   * @returns Objeto con validación y mensaje de error
   */
  validateStringLength(
    value: unknown,
    min: number = 0,
    max: number = 255,
    fieldName: string = 'texto'
  ): { isValid: boolean; message?: string } {
    if (!value) {
      return { isValid: false, message: `El ${fieldName} es obligatorio` };
    }

    const str = String(value).trim();
    if (str.length === 0) {
      return { isValid: false, message: `El ${fieldName} no puede estar vacío` };
    }

    if (str.length < min) {
      return { isValid: false, message: `El ${fieldName} debe tener al menos ${min} caracteres` };
    }

    if (str.length > max) {
      return { isValid: false, message: `El ${fieldName} no puede exceder ${max} caracteres` };
    }

    return { isValid: true };
  }

  // ==========================================================
  // GESTIÓN DINÁMICA DE VALIDADORES (NUEVO)
  // ==========================================================

  /**
   * Actualiza validadores de campos de recurrencia según el estado del checkbox
   * NUEVO: Elimina duplicación en componentes de gastos
   *
   * @param form - FormGroup que contiene los campos
   * @param isRecurring - Si el gasto es recurrente
   */
  updateRecurrenceValidators(form: FormGroup, isRecurring: boolean): void {
    const recurrencePeriod = form.get('recurrence_period');
    const nextOccurrenceDate = form.get('next_occurrence_date');

    if (!recurrencePeriod || !nextOccurrenceDate) {
      console.warn('Campos de recurrencia no encontrados en el formulario');
      return;
    }

    if (isRecurring) {
      // Activar validadores cuando es recurrente
      recurrencePeriod.setValidators([Validators.required]);
      nextOccurrenceDate.setValidators([Validators.required]);
    } else {
      // Limpiar validadores y valores cuando no es recurrente
      recurrencePeriod.clearValidators();
      nextOccurrenceDate.clearValidators();
      form.patchValue({
        recurrence_period: '',
        next_occurrence_date: ''
      }, { emitEvent: false }); // No emitir evento para evitar loops
    }

    // Actualizar estado de validación
    recurrencePeriod.updateValueAndValidity();
    nextOccurrenceDate.updateValueAndValidity();
  }

  // ==========================================================
  // VALIDADORES DE ANGULAR (ValidatorFn para FormControl)
  // ==========================================================

  /**
   * Validador de email para Angular Forms
   * USO: Validators.compose([Validators.required, this.formValidation.emailValidator()])
   */
  emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null; // Deja que required valide si está vacío

      const validation = this.validateEmail(control.value);
      return validation.isValid ? null : { email: { message: validation.message } };
    };
  }

  /**
   * Validador de teléfono para Angular Forms
   */
  phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const validation = this.validatePhone(control.value);
      return validation.isValid ? null : { phone: { message: validation.message } };
    };
  }

  /**
   * Validador de código postal para Angular Forms
   */
  postalCodeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const validation = this.validatePostalCode(control.value);
      return validation.isValid ? null : { postalCode: { message: validation.message } };
    };
  }

  /**
   * Validador de porcentaje para Angular Forms
   */
  percentageValidator(min: number = 0, max: number = 100): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value && control.value !== 0) return null;

      const num = this.dataTransform.parseNumber(control.value);
      if (num < min || num > max) {
        return { percentage: { message: `Debe estar entre ${min} y ${max}%` } };
      }

      return null;
    };
  }

  /**
   * Validador de rango de fechas para FormGroup
   * USO: En un FormGroup con startDate y endDate
   */
  dateRangeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const startDate = control.get('startDate')?.value;
      const endDate = control.get('endDate')?.value;

      const validation = this.validateDateRange(startDate, endDate);
      return validation.isValid ? null : { dateRange: { message: validation.message } };
    };
  }

  /**
   * Validador de rango numérico para FormGroup
   * USO: En un FormGroup con minValue y maxValue
   */
  numericRangeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const minValue = control.get('minValue')?.value;
      const maxValue = control.get('maxValue')?.value;

      if (minValue === null && maxValue === null) {
        return null; // Ambos vacíos es válido
      }

      const minNum = this.dataTransform.parseNumber(minValue);
      const maxNum = this.dataTransform.parseNumber(maxValue);

      if (minNum > maxNum) {
        return { numericRange: { message: 'El mínimo no puede ser mayor al máximo' } };
      }

      return null;
    };
  }

  /**
   * Validador de coincidencia entre dos campos
   * USO: Para validar que password === confirmPassword
   */
  matchFieldsValidator(fieldName1: string, fieldName2: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const field1 = control.get(fieldName1);
      const field2 = control.get(fieldName2);

      if (!field1 || !field2) return null;

      if (field1.value !== field2.value) {
        return { fieldsMismatch: { message: `${fieldName1} y ${fieldName2} no coinciden` } };
      }

      return null;
    };
  }

  // ==========================================================
  // MENSAJES DE ERROR CENTRALIZADOS
  // ==========================================================

  /**
   * Obtiene mensaje de error genérico para un control de formulario
   * Maneja todos los tipos de errores estándar de Angular
   *
   * @param control - Control del formulario
   * @returns Mensaje de error o string vacío
   */
  getErrorMessage(control: AbstractControl | null | undefined): string {
    if (!control || !control.errors) return '';

    // Errores estándar de Angular
    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['email']) return control.errors['email'].message || 'Email inválido';
    if (control.errors['min']) return `Valor mínimo: ${control.errors['min'].min}`;
    if (control.errors['max']) return `Valor máximo: ${control.errors['max'].max}`;
    if (control.errors['pattern']) return 'Formato inválido';

    // Errores personalizados
    if (control.errors['phone']) return control.errors['phone'].message || 'Teléfono inválido';
    if (control.errors['postalCode']) return control.errors['postalCode'].message || 'Código postal inválido';
    if (control.errors['percentage']) return control.errors['percentage'].message || 'Porcentaje inválido';
    if (control.errors['dateRange']) return control.errors['dateRange'].message || 'Rango de fechas inválido';
    if (control.errors['numericRange']) return control.errors['numericRange'].message || 'Rango numérico inválido';
    if (control.errors['fieldsMismatch']) return control.errors['fieldsMismatch'].message || 'Los campos no coinciden';

    return 'Campo inválido';
  }

  /**
   * Obtiene mensaje de error para un FormGroup específico
   * Busca todos los errores del grupo
   *
   * @param control - Control del formulario
   * @param fieldName - Nombre del campo
   * @returns Mensaje de error o string vacío
   */
  getFieldErrorMessage(control: AbstractControl | null, fieldName: string): string {
    const field = control?.get(fieldName);
    return this.getErrorMessage(field);
  }

}
