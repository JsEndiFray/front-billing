import {Injectable} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import Swal from 'sweetalert2';
import { Router} from '@angular/router';
import {EstatesOwners} from '../../../interfaces/estates-owners-interface';
import {EstateOwnersService} from '../entity-services/estate-owners.service';
import {HttpErrorResponse} from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class EstateOwnersUtilServices {


  // Control de estado de carga
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private estateOwnerService: EstateOwnersService,
  ) {
  }


  /**
   * Crea un nuevo FormGroup para UN propietario
   */
  createOwnerFormGroup(): FormGroup {
    return this.fb.group({
      owners_id: [null, Validators.required],
      owner_name: ['', Validators.required],  // Para mostrar en UI
      ownership_percentage: [0, [
        Validators.required,
        Validators.min(1),
        Validators.max(100)
      ]]
    });
  }

  /**
   * Maneja el estado final del guardado
   */
  handleSaveStatus(
    savedCount: number,
    errorCount: number,
    totalOwners: number,
    onSuccess: () => void
  ): boolean {
    const processedCount = savedCount + errorCount;

    if (processedCount === totalOwners) {
      Swal.close();

      if (errorCount === 0) {
        Swal.fire({
          title: 'Éxito!',
          text: `Se registraron ${savedCount} propietarios correctamente`,
          icon: 'success'
        }).then(() => {
          onSuccess(); // Callback para navegar
        });
      } else if (savedCount === 0) {
        Swal.fire({
          title: 'Error!',
          text: 'No se pudo registrar ningún propietario',
          icon: 'error'
        });
      } else {
        Swal.fire({
          title: 'Parcialmente completado',
          text: `Se registraron ${savedCount} de ${totalOwners} propietarios`,
          icon: 'warning'
        });
      }
      return true; // Proceso completado
    }
    return false; // Aún en proceso
  }
  /**
   * Guarda todas las relaciones una por una
   */
  saveAllRelationships(estateId: number, ownersData: EstatesOwners[]): void {
    let savedCount = 0;
    let errorCount = 0;
    const totalOwners = ownersData.length;

    ownersData.forEach((ownerData: EstatesOwners) => {
      const relationshipData: EstatesOwners = {
        estate_id: estateId,
        owners_id: ownerData.owners_id,
        ownership_percentage: Number(ownerData.ownership_percentage)
      };

      this.estateOwnerService.createEstateOwners(relationshipData).subscribe({
        next: (data) => {
          savedCount++;
          // Usar el servicio para manejar el estado
          if (this.handleSaveStatus(savedCount, errorCount, totalOwners, () => this.goBack())) {
            this.loading = false;
          }
        },
        error: (e: HttpErrorResponse) => {
          errorCount++;
          if (this.handleSaveStatus(savedCount, errorCount, totalOwners, () => this.goBack())) {
            this.loading = false;
          }
        }
      });
    });
  };

  /**
   * Calcula el total de porcentajes para mostrar en UI
   */
  getTotalPercentage(ownersFormArray: FormArray): number {
    const ownersData = ownersFormArray.value as EstatesOwners[];
    return ownersData.reduce((total: number, owner: EstatesOwners) => {
      return total + (Number(owner.ownership_percentage) || 0);
    }, 0);
  };


  /**
   * Valida que el total de porcentajes sea exactamente 100
   */
  validateTotalPercentageEquals100(ownersFormArray: FormArray): boolean {
    const total = this.getTotalPercentage(ownersFormArray);
    return total === 100;
  }

  /**
   * Obtiene mensaje de error si el total no es 100%
   */
  getPercentageValidationMessage(ownersFormArray: FormArray): string {
    const total = this.getTotalPercentage(ownersFormArray);

    if (total < 100) {
      return `Faltan ${(100 - total).toFixed(2)}% por asignar`;
    } else if (total > 100) {
      return `Sobran ${(total - 100).toFixed(2)}%. El total no puede exceder 100%`;
    }

    return '';
  }

  /**
   * Cancela el registro y regresa a la lista
   */
  goBack() {
    this.router.navigate(['/dashboards/estates-owners/list']);
  }


}

