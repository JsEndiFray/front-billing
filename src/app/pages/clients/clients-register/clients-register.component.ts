import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

import {
  Clients,
  CompanyOption,
  ClientRegistrationFlow,
  RegistrationState,
  CompanyCreationResult,
} from '../../../interface/clientes-interface';
import { ClientsValidatorService } from '../../../core/services/validator-services/clients-validator.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  providers: [
    ClientsValidatorService
  ],
  templateUrl: './clients-register.component.html',
  styleUrl: './clients-register.component.css'
})
export class ClientsRegisterComponent implements OnInit {

  // ======= ESTADO DEL COMPONENTE =======
  registrationState: RegistrationState = {} as RegistrationState;
  flow: ClientRegistrationFlow = {} as ClientRegistrationFlow;

  constructor(
    private clientsValidatorService: ClientsValidatorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  // ======= MÉTODOS DE INICIALIZACIÓN =======
  private initializeComponent(): void {
    this.clientsValidatorService.initializeRegistration().subscribe({
      next: (companies: CompanyOption[]) => {
        this.updateComponentState();
      },
      error: (e: HttpErrorResponse) => {
        // El interceptor maneja el error automáticamente
      }
    });
  }

  private updateComponentState(): void {
    this.registrationState = this.clientsValidatorService.getRegistrationState();
    this.flow = this.clientsValidatorService.getFlow();
  }

  // ======= MÉTODOS DE NAVEGACIÓN =======
  selectClientType(type: string): void {
    this.clientsValidatorService.selectClientType(type);
    this.updateComponentState();
  }

  changeStep(direction: number): void {
    if (direction === 1) {
      // Avanzar paso
      if (this.flow.clientType === 'empresa' && this.flow.currentStep === 1 && !this.flow.isCompanyCreated) {
        this.createCompanyFirst();
        return;
      }

      const result = this.clientsValidatorService.nextStep();
      if (!result.isValid) {
        // Solo errores de validación local (no HTTP)
        Swal.fire({
          title: 'Error de validación',
          text: result.message || 'Error al avanzar',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
        return;
      }
    } else {
      // Retroceder paso
      const result = this.clientsValidatorService.previousStep();
      if (!result.isValid) {
        // Solo errores de validación local (no HTTP)
        Swal.fire({
          title: 'Error de validación',
          text: result.message || 'Error al retroceder',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
        return;
      }
    }

    this.updateComponentState();
  }

  // ======= MÉTODOS DE CREACIÓN - ACTUALIZADOS =======
  private createCompanyFirst(): void {
    this.clientsValidatorService.createCompany().subscribe({
      next: (client: Clients) => {  // ✅ CORREGIDO: Ahora recibe Clients directamente
        this.updateComponentState();

        // Avanzar al siguiente paso
        const nextStepResult = this.clientsValidatorService.nextStep();
        if (nextStepResult.isValid) {
          this.updateComponentState();

          Swal.fire({
            title: "Empresa registrada",
            text: "Ahora proceda a registrar los administradores",
            icon: "success",
            timer: 2000,
            showConfirmButton: false
          });
        }
      },
      error: (e: HttpErrorResponse) => {
        // El interceptor maneja el error automáticamente
      }
    });
  }

  createClient(): void {
    const validation = this.clientsValidatorService.validateCurrentStep();
    if (!validation.isValid) {
      // Solo errores de validación local (no HTTP)
      Swal.fire({
        title: 'Error de validación',
        text: validation.message || 'Error de validación',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    this.clientsValidatorService.processCompleteRegistration().subscribe({
      next: (response: Clients | CompanyCreationResult) => {  // ✅ CORREGIDO: Tipos actualizados
        if (this.flow.clientType === 'empresa') {
          this.showSuccessAndRedirect('Empresa y administradores registrados correctamente');
        } else {
          this.showSuccessAndRedirect('Cliente registrado correctamente');
        }
      },
      error: (e: HttpErrorResponse) => {
        // El interceptor maneja el error automáticamente
      }
    });
  }

  // ======= MÉTODOS DE ADMINISTRADORES =======
  addAdministrator(): void {
    this.clientsValidatorService.addAdministrator();
    this.updateComponentState();
  }

  removeAdministrator(index: number): void {
    const success = this.clientsValidatorService.removeAdministrator(index);
    if (success) {
      this.updateComponentState();
    }
  }

  updateAdministrator(index: number, field: keyof Clients, value: any): void {
    const update: Partial<Clients> = { [field]: value };
    this.clientsValidatorService.updateAdministrator(index, update);
    this.updateComponentState();
  }

  // ======= MÉTODOS PARA AUTÓNOMOS =======
  onParentCompanyChange(): void {
    const companyId = this.registrationState.client.parent_company_id;

    if (!companyId) {
      this.clientsValidatorService.setParentCompany(0);
      this.updateComponentState();
      return;
    }

    const numericId = typeof companyId === 'string' ? parseInt(companyId, 10) : companyId;

    if (isNaN(numericId)) {
      console.warn('Invalid company ID provided:', companyId);
      this.clientsValidatorService.setParentCompany(0);
    } else {
      this.clientsValidatorService.setParentCompany(numericId);
    }

    this.updateComponentState();
  }

  // ======= MÉTODOS DE ACTUALIZACIÓN DE DATOS =======
  updateCompanyData(field: keyof Clients, value: any): void {
    const update: Partial<Clients> = { [field]: value };
    this.clientsValidatorService.updateCompany(update);
    this.updateComponentState();
  }

  updateClientData(field: keyof Clients, value: any): void {
    const update: Partial<Clients> = { [field]: value };
    this.clientsValidatorService.updateClient(update);
    this.updateComponentState();
  }

  // ======= MÉTODOS DE UTILIDAD DE LA UI =======
  getStepTitle(): string {
    return this.clientsValidatorService.getStepTitle();
  }

  isStepCompleted(step: number): boolean {
    return this.clientsValidatorService.isStepCompleted(step);
  }

  isStepActive(step: number): boolean {
    return this.clientsValidatorService.isStepActive(step);
  }

  isStepVisible(step: number): boolean {
    return this.clientsValidatorService.isStepVisible(step);
  }

  showNextButton(): boolean {
    return this.clientsValidatorService.showNextButton();
  }

  showPrevButton(): boolean {
    return this.clientsValidatorService.showPrevButton();
  }

  showSubmitButton(): boolean {
    return this.clientsValidatorService.showSubmitButton();
  }

  // ======= GETTERS PARA ACCESO A DATOS EN EL TEMPLATE =======
  get company(): Clients {
    return this.registrationState.company || {} as Clients;
  }

  get client(): Clients {
    return this.registrationState.client || {} as Clients;
  }

  get administrators(): Clients[] {
    return this.registrationState.administrators || [];
  }

  get companies(): CompanyOption[] {
    return this.registrationState.companies || [];
  }

  get clientType(): string {
    return this.flow.clientType || '';
  }

  get currentStep(): number {
    return this.flow.currentStep || 0;
  }

  get maxSteps(): number {
    return this.flow.maxSteps || 2;
  }

  // ======= MÉTODOS DE UTILIDAD =======
  private showSuccessAndRedirect(message: string): void {
    Swal.fire({
      title: "¡Éxito!",
      text: message,
      icon: "success",
      draggable: true
    }).then(() => {
      this.router.navigate(['dashboard/clients/list']);
    });
  }
}
