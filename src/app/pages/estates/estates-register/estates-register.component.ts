import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Estates} from '../../../interfaces/estates-interface';
import Swal from 'sweetalert2';
import {EstatesService} from '../../../core/services/estates-services/estates.service';
import {HttpErrorResponse} from '@angular/common/http';
import {Router} from '@angular/router';
import {EstatesValidatorService} from '../../../core/services/validator-services/estates-validator.service';
import {Owners} from '../../../interfaces/owners-interface';
import {OwnersService} from '../../../core/services/owners-services/owners.service';
import {EstateOwnersService} from '../../../core/services/estate-owners-services/estate-owners.service';
import {OwnersValidatorService} from '../../../core/services/validator-services/owners-validator.service';

/**
 * Componente para registrar nuevas propiedades inmobiliarias
 * Permite crear inmuebles con datos completos y validaciones específicas
 */
@Component({
  selector: 'app-estates',
  imports: [
    FormsModule
  ],
  templateUrl: './estates-register.component.html',
  styleUrl: './estates-register.component.css'
})
export class EstatesRegisterComponent {

  // Objeto que guarda los datos de la nueva propiedad
  estate: Estates = {
    id: null,
    cadastral_reference: '',
    price: null,
    address: '',
    postal_code: '',
    location: '',
    province: '',
    country: '',
    surface: null,
    date_create: '',
    date_update: '',
  }

  // === CONTROL DEL STEPPER ===
// Paso actual: 1=Propiedad, 2=Propietarios, 3=Resumen
  currentStep: number = 1;

// Propiedad creada en el paso 1 (se guarda para usar en paso 2)
  createdEstate: Estates | null = null;

// Lista de propietarios seleccionados con sus porcentajes
  selectedOwners: { owner: Owners, percentage: number }[] = [];

// Lista de todos los propietarios disponibles (para el selector)
  availableOwners: Owners[] = [];

  // === CONTROL PARA CREAR PROPIETARIOS ===
// Modal/sección para crear nuevo propietario
  showCreateOwnerForm: boolean = false;

// Datos del nuevo propietario que se está creando
  newOwner: Owners = {
    name: '',
    lastname: '',
    email: '',
    identification: '',
    phone: '',
    address: '',
    postal_code: '',
    location: '',
    province: '',
    country: '',
  };

  // Índice del selector que activó la creación (para asignar automáticamente)
  creatingOwnerForIndex: number = -1;


  constructor(
    private estateService: EstatesService,
    private router: Router,
    private estateValidatorServices: EstatesValidatorService,
    private ownersService: OwnersService,
    private estateOwnersService: EstateOwnersService,
    private ownersValidator: OwnersValidatorService,
  ) {
  }

  /**
   * Carga la lista de propietarios disponibles para el selector
   */
  loadAvailableOwners() {
    this.ownersService.getOwners().subscribe({
      next: (owners) => {
        this.availableOwners = owners;
        // Añadir automáticamente el primer propietario para empezar
        if (this.selectedOwners.length === 0) {
          this.addOwner();
        }
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
  }

  /**
   * PASO 1: Registra la propiedad y avanza al paso de propietarios
   */
  createEstate() {
    // Limpiar espacios y preparar datos
    const cleanEstate = this.estateValidatorServices.cleanEstatesData(this.estate)
    // Validar que todos los campos estén correctos
    const validation = this.estateValidatorServices.validateEstate(cleanEstate)
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error!',
        text: validation.message,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }
    // Enviar datos al servidor para crear la propiedad
    this.estateService.createEstate(cleanEstate).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          // CAMBIO: No redirigir, sino avanzar al siguiente paso
          this.createdEstate = data[0];
          this.currentStep = 2; // Avanzar al paso de propietarios
          this.loadAvailableOwners(); // Cargar lista de propietarios
          Swal.fire({
            title: "Propiedad registrada correctamente",
            text: "Ahora asigna los propietarios",
            icon: "success",
            timer: 2000
          });
        }
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  }

  /**
   * === GESTIÓN DE PROPIETARIOS ===
   */

  /**
   * Añade un propietario a la lista de seleccionados
   */
  addOwner() {
    this.selectedOwners.push({
      owner: {} as Owners, // Propietario vacío para seleccionar
      percentage: 0
    });
  }

  /**
   * Elimina un propietario de la lista
   */
  removeOwner(index: number) {
    this.selectedOwners.splice(index, 1);
  }

  /**
   * Calcula el porcentaje total asignado
   */
  getTotalPercentage(): number {
    return this.selectedOwners.reduce((total, item) => total + (item.percentage || 0), 0);
  }

  /**
   * Valida que el total sea exactamente 100%
   */
  isValidPercentage(): boolean {
    return this.getTotalPercentage() === 100;
  }

  /**
   * Verifica si se puede continuar al paso 3
   */
  canContinueToStep3(): boolean {
    return this.selectedOwners.length > 0 &&
      this.isValidPercentage() &&
      this.selectedOwners.every(item => item.owner && item.owner.id && item.percentage > 0);
  }

  /**
   * PASO 2: Avanza al resumen si todo está válido
   */
  continueToSummary() {
    if (this.canContinueToStep3()) {
      this.currentStep = 3;
    }
  }

  /**
   * Verifica si un propietario ya está seleccionado
   */
  isOwnerAlreadySelected(ownerId: number | undefined, currentIndex: number): boolean {
    // Si no hay ownerId válido, no está duplicado
    if (!ownerId) {
      return false;
    }

    return this.selectedOwners.some((item, index) =>
      index !== currentIndex &&
      item.owner &&
      item.owner.id && // Verificar que el ID existe
      item.owner.id === ownerId
    );
  }

  /**
   * Obtiene propietarios disponibles para un selector específico
   */
  getAvailableOwnersForSelect(currentIndex: number): Owners[] {
    const selectedIds = this.selectedOwners
      .map((item, index) => {
        // Solo incluir IDs de otros selectores que tengan un propietario válido seleccionado
        return (index !== currentIndex && item.owner && item.owner.id) ? item.owner.id : null;
      })
      .filter((id): id is number => id !== null && id !== undefined);

    return this.availableOwners.filter(owner => owner.id && !selectedIds.includes(owner.id));
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
    this.newOwner = {
      name: '',
      lastname: '',
      email: '',
      identification: '',
      phone: '',
      address: '',
      postal_code: '',
      location: '',
      province: '',
      country: '',
    };
  }

  /**
   * Cancela la creación de propietario
   */
  cancelCreateOwner() {
    this.showCreateOwnerForm = false;
    this.creatingOwnerForIndex = -1;
  }

  /**
   * Guarda el nuevo propietario
   */
  saveNewOwner() {
    // Validar datos del nuevo propietario
    const cleanOwner = this.ownersValidator.cleanOwnerData(this.newOwner);
    const validation = this.ownersValidator.validateOwners(cleanOwner);

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

          // Asignar automáticamente al selector que lo creó
          if (this.creatingOwnerForIndex >= 0 && this.creatingOwnerForIndex < this.selectedOwners.length) {
            this.selectedOwners[this.creatingOwnerForIndex].owner = createdOwner;
          }

          // Cerrar formulario
          this.showCreateOwnerForm = false;
          this.creatingOwnerForIndex = -1;

          Swal.fire({
            title: '¡Propietario creado!',
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
   * Guarda todas las relaciones propietario-propiedad
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

    // Contador para seguimiento de guardados exitosos/fallidos
    let savedCount = 0;
    let errorCount = 0;
    const totalOwners = this.selectedOwners.length;

    // Guardar cada propietario uno por uno
    this.selectedOwners.forEach((selectedOwner, index) => {
      const ownershipData = {
        estate_id: this.createdEstate!.id,
        owners_id: selectedOwner.owner.id,
        ownership_percentage: selectedOwner.percentage
      };

      this.estateOwnersService.createEstateOwners(ownershipData).subscribe({
        next: (data) => {
          savedCount++;
          this.checkCompletionStatus(savedCount, errorCount, totalOwners);
        },
        error: (e: HttpErrorResponse) => {
          errorCount++;
          this.checkCompletionStatus(savedCount, errorCount, totalOwners);
        }
      });
    });
  }

  /**
   * Verifica si se completó el guardado y muestra el resultado
   */
  private checkCompletionStatus(savedCount: number, errorCount: number, totalOwners: number) {
    // Si aún no se han procesado todos, esperar
    if (savedCount + errorCount < totalOwners) {
      return;
    }

    // Cerrar loading
    Swal.close();

    // Mostrar resultado según el estado
    if (errorCount === 0) {
      // Todo guardado correctamente
      Swal.fire({
        title: '¡Éxito Completo!',
        text: `Propiedad y ${savedCount} propietarios registrados correctamente`,
        icon: 'success',
        confirmButtonText: 'Ir al Listado'
      }).then(() => {
        this.router.navigate(['/dashboards/estates/list']);
      });
    } else if (savedCount > 0) {
      // Guardado parcial
      Swal.fire({
        title: 'Guardado Parcial',
        html: `
        <p>✅ Propiedad guardada correctamente</p>
        <p>✅ ${savedCount} propietarios guardados</p>
        <p>❌ ${errorCount} propietarios fallaron</p>
        <p><small>Puedes corregir los errores desde la gestión de porcentajes</small></p>
      `,
        icon: 'warning',
        confirmButtonText: 'Ir al Listado'
      }).then(() => {
        this.router.navigate(['/dashboards/estates/list']);
      });
    } else {
      // Todo falló
      Swal.fire({
        title: 'Error en Propietarios',
        html: `
        <p>✅ Propiedad guardada correctamente</p>
        <p>❌ Falló el guardado de todos los propietarios</p>
        <p><small>Puedes asignar propietarios desde la gestión de porcentajes</small></p>
      `,
        icon: 'error',
        confirmButtonText: 'Ir al Listado'
      }).then(() => {
        this.router.navigate(['/dashboards/estates/list']);
      });
    }
  }


  goBack() {
    this.router.navigate(['/dashboards/estates/list'])
  }
}
