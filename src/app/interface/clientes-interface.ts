//listado y registro de clientes
export interface Clients {
  id?: number | null;
  type_client: string;
  name: string;
  lastname: string;
  company_name?: string;
  identification: string;
  phone: string;
  email: string;
  address: string;
  postal_code: string;
  location: string;
  province: string;
  country: string;
  date_create?: string;
  date_update?: string;
  parent_company_id?: number | null;
  relationship_type?: 'administrator';
  parent_company_name?: string;
}

//INTERFACE PARA EMPRESAS EN DROPDOWN
export interface CompanyOption {
  id: number;
  company_name: string;
}

// Interfaces para validaciones
export interface StepValidationResult {
  isValid: boolean;
  message?: string;
}

export interface StepData {
  company?: Clients;
  client?: Clients;
  administrators?: Clients[];
  clientType?: string;
}

// Interfaces para lógica de negocio
export interface CompanyCreationResult {
  companyId: number;
  administratorsCreated: number;
}

export interface ClientRegistrationFlow {
  currentStep: number;
  clientType: string;
  maxSteps: number;
  isCompleted: boolean;
  companyId?: number;
  isCompanyCreated: boolean;
}

// Interface para el estado completo del registro
export interface RegistrationState {
  flow: ClientRegistrationFlow;
  company: Clients;
  client: Clients;
  administrators: Clients[];
  companies: CompanyOption[];
}
