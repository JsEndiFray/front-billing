import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import {
  Clients,
  StepValidationResult,
  CompanyCreationResult,
  ClientRegistrationFlow,
  RegistrationState,
  CompanyOption
} from '../../../interface/clientes-interface';
import { ClientsService } from '../clients-services/clients.service';

@Injectable({
  providedIn: 'root'
})
export class ClientsValidatorService {

  // Estado del proceso de registro - Almacena todo el estado del wizard en memoria
  private registrationState: RegistrationState = {
    flow: {
      currentStep: 0,
      clientType: '',
      maxSteps: 2,
      isCompleted: false,
      companyId: undefined,
      isCompanyCreated: false
    },
    company: this.createEmptyCompany(),
    client: this.createEmptyClient(),
    administrators: [this.createEmptyAdministrator()],
    companies: []
  };

  constructor(private clientsService: ClientsService) {}

  // MÉTODOS DE INICIALIZACIÓN

  // Resetea el wizard y carga empresas existentes del backend para dropdowns
  initializeRegistration(): Observable<CompanyOption[]> {
    this.resetRegistrationState();
    return this.clientsService.getCompanies().pipe(
      switchMap((companies: CompanyOption[]) => {
        this.registrationState.companies = companies;
        return of(companies);
      }),
      catchError(error => throwError(() => error))
    );
  }

  // Borra todos los datos y vuelve al paso 0 del wizard
  private resetRegistrationState(): void {
    this.registrationState = {
      flow: {
        currentStep: 0,
        clientType: '',
        maxSteps: 2,
        isCompleted: false,
        companyId: undefined,
        isCompanyCreated: false
      },
      company: this.createEmptyCompany(),
      client: this.createEmptyClient(),
      administrators: [this.createEmptyAdministrator()],
      companies: []
    };
  }

  // Genera un objeto empresa vacío con valores por defecto para formularios
  private createEmptyCompany(): Clients {
    return {
      id: 0,
      type_client: 'empresa',
      name: 'EMPRESA',
      lastname: 'SOCIEDAD',
      company_name: '',
      identification: '',
      phone: '',
      email: '',
      address: '',
      postal_code: '',
      location: '',
      province: '',
      country: 'España'
    };
  }

  // Genera un objeto cliente vacío con valores por defecto para formularios
  private createEmptyClient(): Clients {
    return {
      id: 0,
      type_client: '',
      name: '',
      lastname: '',
      company_name: '',
      identification: '',
      phone: '',
      email: '',
      address: '',
      postal_code: '',
      location: '',
      province: '',
      country: 'España',
      parent_company_id: undefined,
      relationship_type: undefined
    };
  }

  // Genera un objeto administrador vacío con valores por defecto para formularios
  private createEmptyAdministrator(): Clients {
    return {
      id: 0,
      type_client: 'autonomo',
      name: '',
      lastname: '',
      company_name: '',
      identification: '',
      phone: '',
      email: '',
      address: '',
      postal_code: '',
      location: '',
      province: '',
      country: 'España',
      parent_company_id: undefined,
      relationship_type: 'administrator'
    };
  }

  //MÉTODOS DE ACCESO AL ESTADO (GETTERS)

  // Devuelve una copia completa del estado actual del wizard
  getRegistrationState(): RegistrationState {
    return { ...this.registrationState };
  }

  // Devuelve información del flujo (paso actual, tipo cliente, etc.)
  getFlow(): ClientRegistrationFlow {
    return { ...this.registrationState.flow };
  }

  // Devuelve los datos de la empresa que se está registrando
  getCompany(): Clients {
    return { ...this.registrationState.company };
  }

  // Devuelve los datos del cliente que se está registrando
  getClient(): Clients {
    return { ...this.registrationState.client };
  }

  // Devuelve la lista de administradores que se van a crear
  getAdministrators(): Clients[] {
    return [...this.registrationState.administrators];
  }

  // Devuelve la lista de empresas existentes para seleccionar en dropdowns
  getCompanies(): CompanyOption[] {
    return [...this.registrationState.companies];
  }

  //MÉTODOS DE ACTUALIZACIÓN DE ESTADO (SETTERS)

  // Actualiza parcialmente los datos de la empresa (ej: solo el nombre)
  updateCompany(company: Partial<Clients>): void {
    this.registrationState.company = { ...this.registrationState.company, ...company };
  }

  // Actualiza parcialmente los datos del cliente (ej: solo el email)
  updateClient(client: Partial<Clients>): void {
    this.registrationState.client = { ...this.registrationState.client, ...client };
  }

  // Actualiza un administrador específico de la lista por su posición
  updateAdministrator(index: number, admin: Partial<Clients>): void {
    if (index >= 0 && index < this.registrationState.administrators.length) {
      this.registrationState.administrators[index] = {
        ...this.registrationState.administrators[index],
        ...admin
      };
    }
  }

  // Añade un nuevo administrador vacío a la lista
  addAdministrator(): void {
    const newAdmin = this.createEmptyAdministrator();
    if (this.registrationState.flow.companyId) {
      newAdmin.parent_company_id = this.registrationState.flow.companyId;
    }
    this.registrationState.administrators.push(newAdmin);
  }

  // Elimina un administrador de la lista (mínimo debe quedar 1)
  removeAdministrator(index: number): boolean {
    if (this.registrationState.administrators.length > 1 && index >= 0 && index < this.registrationState.administrators.length) {
      this.registrationState.administrators.splice(index, 1);
      return true;
    }
    return false;
  }

  //MÉTODOS DE NAVEGACIÓN DEL WIZARD

  // Establece si es particular/autonomo/empresa y configura cuántos pasos tendrá
  selectClientType(type: string): void {
    this.registrationState.flow.clientType = type;
    this.registrationState.client.type_client = type;

    if (type === 'empresa') {
      this.registrationState.flow.maxSteps = 3;
    } else {
      this.registrationState.flow.maxSteps = 2;
    }
  }

  // Verifica si es posible ir a un paso específico validando los anteriores
  canNavigateToStep(step: number): StepValidationResult {
    if (step < 0 || step >= this.registrationState.flow.maxSteps) {
      return { isValid: false, message: 'Paso no válido' };
    }

    // Validar pasos anteriores
    for (let i = 0; i < step; i++) {
      const validation = this.validateStep(i);
      if (!validation.isValid) {
        return validation;
      }
    }

    return { isValid: true };
  }

  // Cambia al paso especificado si es válido hacerlo
  navigateToStep(step: number): StepValidationResult {
    const canNavigate = this.canNavigateToStep(step);
    if (canNavigate.isValid) {
      this.registrationState.flow.currentStep = step;
    }
    return canNavigate;
  }

  // Avanza al siguiente paso validando que el actual esté correcto
  nextStep(): StepValidationResult {
    const currentStep = this.registrationState.flow.currentStep;

    // Validar paso actual
    const validation = this.validateStep(currentStep);
    if (!validation.isValid) {
      return validation;
    }

    // Si es empresa en paso 1, necesita crear la empresa primero
    if (this.registrationState.flow.clientType === 'empresa' && currentStep === 1 && !this.registrationState.flow.isCompanyCreated) {
      return { isValid: false, message: 'Debe crear la empresa primero' };
    }

    const nextStep = currentStep + 1;
    if (nextStep >= this.registrationState.flow.maxSteps) {
      return { isValid: false, message: 'Ya está en el último paso' };
    }

    this.registrationState.flow.currentStep = nextStep;
    return { isValid: true };
  }

  // Retrocede al paso anterior sin validaciones
  previousStep(): StepValidationResult {
    const currentStep = this.registrationState.flow.currentStep;

    if (currentStep <= 0) {
      return { isValid: false, message: 'Ya está en el primer paso' };
    }

    this.registrationState.flow.currentStep = currentStep - 1;
    return { isValid: true };
  }

  //MÉTODOS DE VALIDACIÓN POR PASOS

  // Llama a la validación específica según el número de paso (0, 1 o 2)
  validateStep(step: number): StepValidationResult {
    switch (step) {
      case 0:
        return this.validateClientTypeStep();
      case 1:
        return this.validateDataStep();
      case 2:
        return this.validateAdministratorsStep();
      default:
        return { isValid: true };
    }
  }

  // Valida el paso en el que está actualmente el usuario
  validateCurrentStep(): StepValidationResult {
    return this.validateStep(this.registrationState.flow.currentStep);
  }

  // Verifica que se haya seleccionado particular/autonomo/empresa
  private validateClientTypeStep(): StepValidationResult {
    if (!this.registrationState.flow.clientType) {
      return { isValid: false, message: 'Por favor, seleccione un tipo de cliente' };
    }
    return { isValid: true };
  }

  // Valida los datos según el tipo (empresa vs personal)
  private validateDataStep(): StepValidationResult {
    if (this.registrationState.flow.clientType === 'empresa') {
      return this.validateClient(this.registrationState.company);
    } else {
      return this.validateClient(this.registrationState.client);
    }
  }

  // Valida que todos los administradores tengan datos correctos
  private validateAdministratorsStep(): StepValidationResult {
    for (let i = 0; i < this.registrationState.administrators.length; i++) {
      const admin = this.registrationState.administrators[i];
      const validation = this.validateClient(admin);
      if (!validation.isValid) {
        return { isValid: false, message: `Error en el administrador ${i + 1}: ${validation.message}` };
      }
    }
    return { isValid: true };
  }

  //MÉTODOS DE CREACIÓN EN BACKEND (LOS IMPORTANTES)

  // Envía la empresa al backend, recibe el objeto completo y actualiza el estado
  createCompany(): Observable<Clients> {
    const validation = this.validateClient(this.registrationState.company);
    if (!validation.isValid) {
      return throwError(() => new Error(validation.message || 'Error en los datos de la empresa'));
    }

    const cleanCompany = this.cleanClientData(this.registrationState.company);

    return this.clientsService.createClientes(cleanCompany).pipe(
      switchMap((response: Clients) => {
        // Acceder directamente al ID del objeto devuelto por el backend
        const companyId = response.id;

        if (!companyId) {
          throw new Error('No se pudo obtener el ID de la empresa creada');
        }

        // Actualizar estado con la empresa creada
        this.registrationState.flow.companyId = companyId;
        this.registrationState.flow.isCompanyCreated = true;

        // Configurar administradores con la empresa creada
        this.registrationState.administrators.forEach(admin => {
          admin.parent_company_id = companyId;
        });

        return of(response);
      }),
      catchError(error => throwError(() => error))
    );
  }

  // Envía un cliente individual al backend y devuelve el objeto completo
  createSingleClient(): Observable<Clients> {
    const validation = this.validateClient(this.registrationState.client);
    if (!validation.isValid) {
      return throwError(() => new Error(validation.message || 'Error en los datos del cliente'));
    }

    const cleanClient = this.cleanClientData(this.registrationState.client);
    return this.clientsService.createClientes(cleanClient);
  }

  // Crea todos los administradores uno por uno de forma secuencial
  createAdministrators(): Observable<CompanyCreationResult> {
    const validation = this.validateAdministratorsStep();
    if (!validation.isValid) {
      return throwError(() => new Error(validation.message || 'Error en los datos de los administradores'));
    }

    return new Observable(observer => {
      let adminIndex = 0;
      let administratorsCreated = 0;

      const createNextAdmin = (): void => {
        if (adminIndex >= this.registrationState.administrators.length) {
          // Todos los administradores creados exitosamente
          this.registrationState.flow.isCompleted = true;
          observer.next({
            companyId: this.registrationState.flow.companyId || 0,
            administratorsCreated
          });
          observer.complete();
          return;
        }

        const admin = this.registrationState.administrators[adminIndex];

        // Asegurar que parent_company_id esté configurado
        if (!admin.parent_company_id && this.registrationState.flow.companyId) {
          admin.parent_company_id = this.registrationState.flow.companyId;
        }

        // Verificar que parent_company_id sea válido
        if (!admin.parent_company_id || isNaN(admin.parent_company_id)) {
          observer.error(new Error(`No se pudo asignar la empresa al administrador ${adminIndex + 1}`));
          return;
        }

        const cleanAdmin = this.cleanClientData(admin);

        this.clientsService.createClientes(cleanAdmin).subscribe({
          next: (response: Clients) => {
            administratorsCreated++;
            adminIndex++;
            createNextAdmin(); // Crear el siguiente administrador
          },
          error: (error) => {
            observer.error(error);
          }
        });
      };

      createNextAdmin(); // Iniciar la creación del primer administrador
    });
  }

  // Decide si crear empresa+admins o solo cliente según el tipo
  processCompleteRegistration(): Observable<Clients | CompanyCreationResult> {
    if (this.registrationState.flow.clientType === 'empresa') {
      // Para empresas, crear administradores (la empresa ya está creada)
      return this.createAdministrators();
    } else {
      // Para particular/autónomo, crear directamente
      return this.createSingleClient();
    }
  }

  //MÉTODOS DE CONFIGURACIÓN

  // Asigna una empresa padre a un cliente autónomo
  setParentCompany(companyId: number): void {
    if (companyId && companyId > 0) {
      this.registrationState.client.parent_company_id = companyId;
      this.registrationState.client.relationship_type = 'administrator';
    } else {
      this.registrationState.client.parent_company_id = undefined;
      this.registrationState.client.relationship_type = undefined;
    }
  }

  //MÉTODOS DE UTILIDAD PARA LA UI

  // Devuelve el título a mostrar según el paso actual
  getStepTitle(): string {
    const currentStep = this.registrationState.flow.currentStep;
    switch (currentStep) {
      case 0: return 'Tipo de Cliente';
      case 1:
        if (this.registrationState.flow.clientType === 'empresa') return 'Datos de la Empresa';
        return 'Datos Personales';
      case 2: return 'Administradores';
      default: return '';
    }
  }

  // Determina si un paso ya se completó (para mostrar check verde)
  isStepCompleted(step: number): boolean {
    return this.registrationState.flow.currentStep > step;
  }

  // Determina si un paso está activo (para resaltarlo)
  isStepActive(step: number): boolean {
    return this.registrationState.flow.currentStep === step;
  }

  // Determina si un paso se debe mostrar (paso 2 solo para empresas)
  isStepVisible(step: number): boolean {
    if (step === 2) {
      return this.registrationState.flow.clientType === 'empresa';
    }
    return true;
  }

  // Determina si mostrar el botón "Siguiente" en la UI
  showNextButton(): boolean {
    return this.registrationState.flow.currentStep < this.registrationState.flow.maxSteps - 1 &&
      this.registrationState.flow.clientType !== '';
  }

  // Determina si mostrar el botón "Anterior" en la UI
  showPrevButton(): boolean {
    return this.registrationState.flow.currentStep > 0;
  }

  // Determina si mostrar el botón "Enviar" en la UI
  showSubmitButton(): boolean {
    return this.registrationState.flow.currentStep === this.registrationState.flow.maxSteps - 1;
  }

  //MÉTODOS DE LIMPIEZA Y VALIDACIÓN DE DATOS

  // Normaliza datos (mayúsculas, trim, etc.) antes de enviar al backend
  cleanClientData(client: Clients): Clients {
    return {
      id: client.id,
      type_client: client.type_client?.trim(),
      name: client.name?.toUpperCase().trim() || '',
      lastname: client.lastname?.toUpperCase().trim() || '',
      company_name: client.company_name?.toUpperCase().trim() || '',
      identification: client.identification?.toUpperCase().trim() || '',
      phone: client.phone?.trim() || '',
      email: client.email?.toLowerCase().trim() || '',
      address: client.address?.toUpperCase().trim() || '',
      postal_code: client.postal_code?.trim() || '',
      location: client.location?.toUpperCase().trim() || '',
      province: client.province?.toUpperCase().trim() || '',
      country: client.country?.toUpperCase().trim() || '',
      parent_company_id: client.parent_company_id,
      relationship_type: client.relationship_type
    } as Clients;
  }

  // Verifica que todos los campos obligatorios estén completos
  validateRequiredFields(client: Clients): { isValid: boolean; message?: string } {
    // Validación campo por campo
    if (!client.type_client || client.type_client.trim() === '') {
      return { isValid: false, message: 'El tipo de cliente es obligatorio' };
    }

    // Para EMPRESAS: validar company_name, NO name/lastname
    if (client.type_client === 'empresa') {
      if (!client.company_name || client.company_name.trim() === '') {
        return {
          isValid: false,
          message: 'El nombre de la empresa es obligatorio'
        };
      }
    } else {
      // Para PARTICULARES y AUTÓNOMOS: validar name/lastname
      if (!client.name || client.name.trim() === '') {
        return { isValid: false, message: 'El nombre es obligatorio' };
      }
      if (!client.lastname || client.lastname.trim() === '') {
        return { isValid: false, message: 'El apellido es obligatorio' };
      }
    }

    if (!client.identification || client.identification.trim() === '') {
      return { isValid: false, message: 'La identificación es obligatoria' };
    }

    if (!client.email || client.email.trim() === '') {
      return { isValid: false, message: 'El email es obligatorio' };
    }

    if (!client.phone || client.phone.trim() === '') {
      return { isValid: false, message: 'El teléfono es obligatorio' };
    }

    if (!client.address || client.address.trim() === '') {
      return { isValid: false, message: 'La dirección es obligatoria' };
    }

    if (!client.postal_code || client.postal_code.trim() === '') {
      return { isValid: false, message: 'El código postal es obligatorio' };
    }

    if (!client.location || client.location.trim() === '') {
      return { isValid: false, message: 'La localidad es obligatoria' };
    }

    if (!client.province || client.province.trim() === '') {
      return { isValid: false, message: 'La provincia es obligatoria' };
    }

    if (!client.country || client.country.trim() === '') {
      return { isValid: false, message: 'El país es obligatorio' };
    }

    return { isValid: true };
  }

  // Valida que DNI/NIE/CIF sea correcto según el tipo de cliente
  validateIdentification(client: Clients): { isValid: boolean; message?: string } {
    const identification = client.identification?.trim().toUpperCase();
    if (!identification) {
      return {
        isValid: false,
        message: 'La identificación es obligatoria'
      };
    }

    // Patrones de validación españoles
    const dniPattern = /^\d{8}[A-Z]$/;           // 12345678A
    const niePattern = /^[XYZ]\d{7}[A-Z]$/;     // X1234567A
    const cifPattern = /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/;  // A12345678

    switch (client.type_client?.toLowerCase()) {
      case 'particular':
      case 'autonomo':
        if (!dniPattern.test(identification) && !niePattern.test(identification)) {
          return {
            isValid: false,
            message: 'Los particulares/autónomos deben usar DNI (12345678A) o NIE (X1234567A)'
          };
        }
        break;
      case 'empresa':
        if (!cifPattern.test(identification)) {
          return {
            isValid: false,
            message: 'Las empresas deben usar CIF válido (A12345678)'
          };
        }
        break;
      default:
        return {
          isValid: false,
          message: 'Debe seleccionar el tipo de cliente'
        };
    }
    return { isValid: true };
  }

  // Verifica que el email tenga formato válido
  validateEmail(email: string): { isValid: boolean; message?: string } {
    if (!email || email.trim() === '') {
      return {
        isValid: false,
        message: 'El email es obligatorio'
      };
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return {
        isValid: false,
        message: 'El formato del email no es válido'
      };
    }
    return { isValid: true };
  }

  // Verifica que el teléfono tenga exactamente 9 dígitos
  validatePhone(phone: string): { isValid: boolean; message?: string } {
    if (!phone || phone.trim() === '') {
      return {
        isValid: false,
        message: 'El teléfono es obligatorio'
      };
    }
    // Validar teléfono español (9 dígitos)
    const phonePattern = /^\d{9}$/;
    if (!phonePattern.test(phone)) {
      return {
        isValid: false,
        message: 'El teléfono debe tener exactamente 9 dígitos'
      };
    }
    return { isValid: true };
  }

  // Ejecuta todas las validaciones anteriores en secuencia
  validateClient(client: Clients): { isValid: boolean; message?: string } {
    // 1. Limpiar datos
    const cleanClient = this.cleanClientData(client);

    // 2. Validar campos requeridos
    const requiredValidation = this.validateRequiredFields(cleanClient);
    if (!requiredValidation.isValid) {
      return requiredValidation;
    }

    // 3. Validar identificación
    const identificationValidation = this.validateIdentification(cleanClient);
    if (!identificationValidation.isValid) {
      return identificationValidation;
    }

    // 4. Validar email
    const emailValidation = this.validateEmail(cleanClient.email);
    if (!emailValidation.isValid) {
      return emailValidation;
    }

    // 5. Validar teléfono
    const phoneValidation = this.validatePhone(cleanClient.phone);
    if (!phoneValidation.isValid) {
      return phoneValidation;
    }

    return { isValid: true };
  }
}
