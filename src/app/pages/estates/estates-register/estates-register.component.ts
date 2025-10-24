import {Component} from '@angular/core';
import {Estates} from '../../../interfaces/estates-interface';
import {FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import Swal from 'sweetalert2';
import {EstatesService} from '../../../core/services/entity-services/estates.service';
import {HttpErrorResponse} from '@angular/common/http';
import {Router} from '@angular/router';
import {Owners} from '../../../interfaces/owners-interface';
import {OwnersService} from '../../../core/services/entity-services/owners.service';
import {EstateOwnersService} from '../../../core/services/entity-services/estate-owners.service';
import {ValidatorService} from '../../../core/services/validator-services/validator.service';
import {forkJoin} from 'rxjs';

/**
 * Componente para registrar nuevas propiedades inmobiliarias
 * Permite crear inmuebles con datos completos y validaciones específicas
 */
@Component({
  selector: 'app-estates',
  imports: [
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './estates-register.component.html',
  styleUrl: './estates-register.component.css'
})
export class EstatesRegisterComponent {

  // ==========================================
  // PROPIEDADES DE FORMULARIOS MÚLTIPLES
  // ==========================================

  // Formulario de propiedades
  estateForm: FormGroup;
  // Formulario de propietarios
  ownersForm: FormGroup;
  // Formulario de nuevo propietarios
  newOwnerForm: FormGroup;

  // === CONTROL DEL STEPPER ===
  // Paso actual: 1=Propiedad, 2=Propietarios, 3=Resumen
  currentStep: number = 1;
  // Propiedad creada en el paso 1 (se guarda para usar en paso 2)
  createdEstate: Estates | null = null;

  // Lista de todos los propietarios disponibles (para el selector)
  availableOwners: Owners[] = [];

  // === CONTROL PARA CREAR PROPIETARIOS ===
  // Modal/sección para crear nuevo propietario
  showCreateOwnerForm: boolean = false;

  // Índice del selector que activó la creación (para asignar automáticamente)
  creatingOwnerForIndex: number = -1;

  constructor(
    private estateService: EstatesService,
    private router: Router,
    private validatorService: ValidatorService,
    private ownersService: OwnersService,
    private estateOwnersService: EstateOwnersService,
    private fb: FormBuilder,
  ) {
    this.estateForm = this.fb.group({
      cadastral_reference: ['', [Validators.required]],
      price: [null, [Validators.required, Validators.min(0)]],
      surface: [null, [Validators.required, Validators.min(1)]],
      address: ['', [Validators.required]],
      postal_code: ['', [Validators.required, Validators.pattern('[0-9]{5}')]],
      location: ['', [Validators.required]],
      province: ['', [Validators.required]],
      country: ['España', [Validators.required]]
    });

    // FormArray vacío inicialmente
    this.ownersForm = this.fb.group({
      selectedOwners: this.fb.array([])
    });

    this.newOwnerForm = this.fb.group({
      name: ['', [Validators.required]],
      lastname: ['', [Validators.required]],
      identification: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      address: ['', [Validators.required]],
      postal_code: ['', [Validators.required, Validators.pattern('[0-9]{5}')]],
      location: ['', [Validators.required]],
      province: ['', [Validators.required]],
      country: ['España', [Validators.required]]
    });
  }

  // Getter para acceder fácilmente al FormArray
  get selectedOwnersArray(): FormArray {
    return this.ownersForm.get('selectedOwners') as FormArray;
  }

  /**
   * Carga la lista de propietarios disponibles y inicializa el FormArray
   */
  loadAvailableOwners() {
    this.ownersService.getOwners().subscribe({
      next: (owners) => {
        this.availableOwners = owners;

        // Inicializar con un propietario vacío si no hay ninguno
        if (this.selectedOwnersArray.length === 0) {
          this.addOwner();
        }
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  //======================
  // METODOS CRUD
  //=====================

  /**
   * Registra la propiedad con validación completa (formato + existencia real)
   */
  async createEstate() {

    // Validación básica de formulario Angular
    if (!this.estateForm.valid) {
      Swal.fire({
        title: 'Error!',
        text: 'Datos incorrectos.',
        icon: 'error'
      });
      return;
    }

    // Obtener valores del FormGroup
    const estateData = this.estateForm.value;

    // Aplicar transformaciones (mayúsculas, etc.)
    this.validatorService.applyTransformations(this.estateForm, 'estate');

    // Actualizar estateData con valores transformados
    const transformedData = this.estateForm.value;

    // Mostrar loading durante toda la validación
    Swal.fire({
      title: 'Validando propiedad...',
      text: 'Verificando datos y consultando Catastro oficial',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Validación completa (formato + existencia real)
      const validation = await this.validatorService.validateEstate(transformedData);

      if (!validation.isValid) {
        Swal.close();
        Swal.fire({
          title: 'Error de Validación',
          text: validation.message,
          icon: 'error',
          confirmButtonText: 'Corregir'
        });
        return;
      }

      // Si hay mensaje de advertencia (ej: problema de conexión), mostrarlo
      if (validation.message) {
        Swal.update({
          title: 'Advertencia',
          text: validation.message,
          icon: 'warning'
        });
        // Esperar 2 segundos para que el usuario lea la advertencia
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // Cambiar loading a "guardando"
      Swal.update({
        title: 'Guardando propiedad...',
        text: 'Registrando en base de datos',
        icon: 'info'
      });

      // Enviar datos al servidor para crear la propiedad
      this.estateService.createEstate(transformedData).subscribe({
        next: (data) => {
          Swal.close();

          if (data && data.length > 0) {
            this.createdEstate = data[0];
            this.currentStep = 2; // Avanzar al paso de propietarios
            this.loadAvailableOwners();

            Swal.fire({
              title: "Propiedad registrada",
              html: `
              <p>✅ Referencia catastral verificada</p>
              <p>✅ Propiedad guardada correctamente</p>
              <p>Ahora asigna los propietarios</p>
            `,
              icon: "success",
              timer: 3000
            });
          }
        },
        error: (e: HttpErrorResponse) => {
          Swal.close();
          // Error manejado por interceptor
        }
      });

    } catch (error) {
      Swal.close();
      Swal.fire({
        title: 'Error Inesperado',
        text: 'Hubo un problema validando la propiedad. Inténtalo de nuevo.',
        icon: 'error',
        confirmButtonText: 'Reintentar'
      });
    }
  }

  /**
   * Vuelve al paso 1 para editar la propiedad
   */
  goBackToStep1() {
    // Advertir al usuario que puede perder los propietarios asignados
    if (this.selectedOwnersArray.length > 0) {
      Swal.fire({
        title: 'Volver a Editar Propiedad',
        html: `
          <p>Si vuelves al paso 1:</p>
          <ul style="text-align: left;">
            <li>✅ Podrás editar los datos de la propiedad</li>
            <li>⚠️ Mantendrás los propietarios asignados</li>
            <li>🔄 Tendrás que validar la propiedad nuevamente</li>
          </ul>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, volver a editar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.currentStep = 1;
          // NO limpiar selectedOwnersArray para mantener propietarios
        }
      });
    } else {
      // Si no hay propietarios, volver directamente
      this.currentStep = 1;
    }
  }

  /**
   * Actualizar la propiedad existente (cuando vuelve del paso 2 al paso 1)
   */
  async updateExistingEstate() {
    if (!this.createdEstate) {
      // Si no hay propiedad creada, crear una nueva
      await this.createEstate();
      return;
    }

    // Validación básica de formulario Angular
    if (!this.estateForm.valid) {
      this.estateForm.markAllAsTouched();
      Swal.fire({
        title: 'Error!',
        text: 'Datos incorrectos.',
        icon: 'error'
      });
      return;
    }

    // Obtener valores del FormGroup
    const estateData = this.estateForm.value;

    // Aplicar transformaciones
    this.validatorService.applyTransformations(this.estateForm, 'estate');
    const transformedData = this.estateForm.value;

    // Mostrar loading
    Swal.fire({
      title: 'Actualizando propiedad...',
      text: 'Verificando cambios y consultando Catastro',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Validación completa
      const validation = await this.validatorService.validateEstate(transformedData);

      if (!validation.isValid) {
        Swal.close();
        Swal.fire({
          title: 'Error de Validación',
          text: validation.message,
          icon: 'error',
          confirmButtonText: 'Corregir'
        });
        return;
      }

      // Si hay advertencia, mostrarla
      if (validation.message) {
        Swal.update({
          title: 'Advertencia',
          text: validation.message,
          icon: 'warning'
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Actualizar propiedad en servidor
      Swal.update({
        title: 'Guardando cambios...',
        text: 'Actualizando base de datos',
        icon: 'info'
      });

      // Agregar el ID para la actualización
      const updateData = {...transformedData, id: this.createdEstate.id};

      this.estateService.updateEstate(this.createdEstate.id!, updateData).subscribe({
        next: (data) => {
          Swal.close();

          if (data && data.length > 0) {
            this.createdEstate = data[0];
            this.currentStep = 2; // Volver al paso de propietarios

            Swal.fire({
              title: "Propiedad actualizada",
              html: `
                <p>✅ Cambios guardados correctamente</p>
                <p>Continúa con los propietarios</p>
              `,
              icon: "success",
              timer: 2000
            });
          }
        },
        error: (e: HttpErrorResponse) => {
          Swal.close();
          // Error manejado por interceptor
        }
      });

    } catch (error) {
      Swal.close();
      Swal.fire({
        title: 'Error Inesperado',
        text: 'Hubo un problema validando la propiedad. Inténtalo de nuevo.',
        icon: 'error',
        confirmButtonText: 'Reintentar'
      });
    }
  }

  /**
   * === GESTIÓN DE PROPIETARIOS CON FORMARRAY ===
   */

  /**
   * Crea un FormGroup para un solo propietario
   */
  private createOwnerFormGroup(owner?: Owners, percentage: number = 0): FormGroup {
    return this.fb.group({
      owner: [owner || null, [Validators.required]],
      percentage: [
        percentage,
        [
          Validators.required,
          Validators.min(0.01),
          Validators.max(100)
        ]
      ]
    });
  }

  /**
   * Añade un propietario al FormArray
   */
  addOwner() {
    const ownerGroup = this.createOwnerFormGroup();
    this.selectedOwnersArray.push(ownerGroup);

    // Configurar validación en tiempo real para porcentajes
    this.setupPercentageValidation(this.selectedOwnersArray.length - 1);
  }

  /**
   * Elimina un propietario del FormArray
   */
  removeOwner(index: number) {
    this.selectedOwnersArray.removeAt(index);

    // Revalidar porcentajes después de eliminar
    this.validateAllPercentages();
  }

  /**
   * Configurar validación en tiempo real para porcentajes
   */
  private setupPercentageValidation(index: number) {
    const ownerGroup = this.selectedOwnersArray.at(index) as FormGroup;
    const percentageControl = ownerGroup.get('percentage');

    if (percentageControl) {
      // Validar cada vez que cambia el valor
      percentageControl.valueChanges.subscribe(() => {
        this.validateAllPercentages();
      });
    }
  }

  /**
   * Valida que el total de porcentajes sea exactamente 100%
   */
  private validateAllPercentages() {
    const total = this.getTotalPercentage();

    // Marcar todos los controles de porcentaje con error si no suma 100%
    for (let i = 0; i < this.selectedOwnersArray.length; i++) {
      const ownerGroup = this.selectedOwnersArray.at(i) as FormGroup;
      const percentageControl = ownerGroup.get('percentage');

      if (percentageControl) {
        const errors = percentageControl.errors || {};

        if (total !== 100) {
          errors['totalNotValid'] = {
            current: total,
            required: 100
          };
        } else {
          delete errors['totalNotValid'];
        }

        // Si no hay errores, limpiar
        const hasErrors = Object.keys(errors).length > 0;
        percentageControl.setErrors(hasErrors ? errors : null);
      }
    }
  }

  /**
   * Calcula el porcentaje total asignado
   */
  getTotalPercentage(): number {
    let total = 0;

    for (let i = 0; i < this.selectedOwnersArray.length; i++) {
      const ownerGroup = this.selectedOwnersArray.at(i) as FormGroup;
      const percentage = ownerGroup.get('percentage')?.value || 0;
      total += Number(percentage);
    }
    return total;
  }

  /**
   * Verifica si se puede continuar al paso 3
   */
  canContinueToStep3(): boolean {
    return this.selectedOwnersArray.length > 0 &&
      this.ownersForm.valid &&
      this.getTotalPercentage() === 100;
  }

  /**
   * PASO 2: Avanza al resumen si todo está válido
   */
  continueToSummary() {
    if (this.canContinueToStep3()) {
      this.currentStep = 3;
    } else {
      // Mostrar errores específicos
      let errorMessage = 'No puedes continuar por los siguientes errores:\n';

      if (this.selectedOwnersArray.length === 0) {
        errorMessage += '• Debes agregar al menos un propietario\n';
      }

      if (this.getTotalPercentage() !== 100) {
        errorMessage += `• Los porcentajes deben sumar exactamente 100% (actual: ${this.getTotalPercentage()}%)\n`;
      }

      // Verificar si hay propietarios sin seleccionar
      const emptyOwners = this.getEmptyOwners();
      if (emptyOwners.length > 0) {
        errorMessage += `• Debes seleccionar propietarios en las filas: ${emptyOwners.join(', ')}\n`;
      }

      Swal.fire({
        title: 'Errores en Propietarios',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Corregir'
      });
    }
  }

  /**
   * Obtiene índices de propietarios sin seleccionar
   */
  private getEmptyOwners(): number[] {
    const empty = [];
    for (let i = 0; i < this.selectedOwnersArray.length; i++) {
      const ownerGroup = this.selectedOwnersArray.at(i) as FormGroup;
      const owner = ownerGroup.get('owner')?.value;
      if (!owner || !owner.id) {
        empty.push(i + 1); // +1 para mostrar número humano-legible
      }
    }
    return empty;
  }

  /**
   * Verifica si un propietario ya está seleccionado
   */
  isOwnerAlreadySelected(ownerId: number | undefined, currentIndex: number): boolean {
    if (!ownerId) return false;

    for (let i = 0; i < this.selectedOwnersArray.length; i++) {
      if (i !== currentIndex) {
        const ownerGroup = this.selectedOwnersArray.at(i) as FormGroup;
        const owner = ownerGroup.get('owner')?.value;
        if (owner && owner.id === ownerId) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Obtiene propietarios disponibles para un selector específico
   */
  getAvailableOwnersForSelect(currentIndex: number): Owners[] {
    const selectedIds: number[] = [];

    for (let i = 0; i < this.selectedOwnersArray.length; i++) {
      if (i !== currentIndex) {
        const ownerGroup = this.selectedOwnersArray.at(i) as FormGroup;
        const owner = ownerGroup.get('owner')?.value;
        if (owner && owner.id) {
          selectedIds.push(owner.id);
        }
      }
    }

    return this.availableOwners.filter(owner =>
      owner.id && !selectedIds.includes(owner.id)
    );
  }

  /**
   * === CREACIÓN DE PROPIETARIOS ===
   */

  /**
   * Abre el formulario para crear un nuevo propietario
   */
  openCreateOwnerForm(forIndex: number) {
    this.creatingOwnerForIndex = forIndex;
    this.showCreateOwnerForm = true;
    // Limpiar formulario
    this.newOwnerForm.reset({
      name: '',
      lastname: '',
      email: '',
      identification: '',
      phone: '',
      address: '',
      postal_code: '',
      location: '',
      province: '',
      country: 'España',
    });
  }

  /**
   * Cancela la creación de propietario
   */
  cancelCreateOwner() {
    this.showCreateOwnerForm = false;
    this.creatingOwnerForIndex = -1;
    this.newOwnerForm.reset();
  }

  /**
   * Guarda el nuevo propietario
   */
  saveNewOwner() {

    // Validar formulario Angular primero
    if (!this.newOwnerForm.valid) {
      this.newOwnerForm.markAllAsTouched();
      Swal.fire({
        title: 'Error de validación',
        text: 'Completa todos los campos requeridos correctamente',
        icon: 'error'
      });
      return;
    }

    // Aplicar transformaciones
    this.validatorService.applyTransformations(this.newOwnerForm, 'owner');
    const cleanOwner = this.newOwnerForm.value;

    const validation = this.validatorService.validateOwner(cleanOwner);
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error de validación',
        text: validation.message,
        icon: 'error'
      });
      return;
    }
    // Mostrar loading
    Swal.fire({
      title: 'Creando propietario...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Guardar en servidor
    this.ownersService.createOwners(cleanOwner).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          const createdOwner = data[0];

          // Añadir a la lista de disponibles
          this.availableOwners.push(createdOwner);

          // CORRECCIÓN: Asignar automáticamente usando FormGroup
          if (this.creatingOwnerForIndex >= 0 && this.creatingOwnerForIndex < this.selectedOwnersArray.length) {
            const targetGroup = this.selectedOwnersArray.at(this.creatingOwnerForIndex) as FormGroup;
            targetGroup.get('owner')?.setValue(createdOwner);
          }

          // Cerrar formulario
          this.showCreateOwnerForm = false;
          this.creatingOwnerForIndex = -1;
          this.newOwnerForm.reset();
          Swal.fire({
            title: 'Propietario creado',
            text: 'El propietario ha sido asignado automáticamente',
            icon: 'success',
            timer: 2000
          });
        }
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
        Swal.close();
      }
    });
  }

  /**
   * === PASO 3: GUARDADO FINAL ===
   */

  /**
   * Guarda todas las relaciones propietario-propiedad usando forkJoin (PARALELO)
   */
  saveAllOwnershipData() {
    if (!this.createdEstate || !this.canContinueToStep3()) {
      Swal.fire({
        title: 'Error',
        text: 'Datos incompletos para guardar',
        icon: 'error'
      });
      return;
    }

    // Mostrar loading
    Swal.fire({
      title: 'Guardando...',
      text: 'Registrando propietarios y porcentajes',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // CREAR ARRAY DE OBSERVABLES para forkJoin
    const ownershipRequests = [];

    for (let i = 0; i < this.selectedOwnersArray.length; i++) {
      const ownerGroup = this.selectedOwnersArray.at(i) as FormGroup;
      const owner = ownerGroup.get('owner')?.value;
      const percentage = ownerGroup.get('percentage')?.value;

      const ownershipData = {
        estate_id: this.createdEstate!.id,
        owners_id: owner.id,
        ownership_percentage: percentage
      };

      // Agregar observable al array
      ownershipRequests.push(
        this.estateOwnersService.createEstateOwners(ownershipData)
      );
    }

    // EJECUTAR TODAS LAS PETICIONES EN PARALELO
    forkJoin(ownershipRequests).subscribe({
      next: (results) => {
        Swal.close();

        // Todos guardados correctamente
        Swal.fire({
          title: 'Éxito Completo',
          text: `Propiedad y ${results.length} propietarios registrados correctamente`,
          icon: 'success',
          confirmButtonText: 'Ir al Listado'
        }).then(() => {
          this.router.navigate(['/dashboards/estates/list']);
        });
      },
      error: (error) => {
        Swal.close();

        // Si hay cualquier error
        Swal.fire({
          title: 'Error al Guardar',
          html: `
            <p>✅ Propiedad guardada correctamente</p>
            <p>❌ Error guardando algunos propietarios</p>
            <p><small>Puedes corregir desde la gestión de porcentajes</small></p>
          `,
          icon: 'error',
          confirmButtonText: 'Ir al Listado'
        }).then(() => {
          this.router.navigate(['/dashboards/estates/list']);
        });
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboards/estates/list'])
  }
}
