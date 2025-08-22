import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Owners} from '../../../interfaces/owners-interface';
import {OwnersService} from '../../../core/services/owners-services/owners.service';
import {OwnersValidatorService} from '../../../core/services/validator-services/owners-validator.service';
import {Router} from '@angular/router';
import Swal from 'sweetalert2';
import {HttpErrorResponse} from '@angular/common/http';

/**
 * Componente para registrar nuevos propietarios
 * Permite crear propietarios con datos completos de contacto y dirección
 */
@Component({
  selector: 'app-owners',
  imports: [
    FormsModule
  ],
  templateUrl: './owners-register.component.html',
  styleUrl: './owners-register.component.css'
})
export class OwnersRegisterComponent {

  // Objeto que guarda los datos del nuevo propietario
  owner: Owners = {
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
    date_create: '',
    date_update: '',
  }

  constructor(
    private ownersServices: OwnersService,
    private ownersValidator: OwnersValidatorService,
    private router: Router
  ) {
  }

  /**
   * Registra un nuevo propietario en el sistema
   * Valida todos los datos antes de enviar al servidor
   */
  createOwners() {
    // Limpiar espacios y preparar datos
    const cleanOwners = this.ownersValidator.cleanOwnerData(this.owner);

    // Validar que todos los campos estén correctos
    const validation = this.ownersValidator.validateOwners(cleanOwners)
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error!',
        text: validation.message,
        icon: 'error'
      });
      return;
    }

    // Enviar datos al servidor para crear propietario
    this.ownersServices.createOwners(cleanOwners).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.owner = data[0];
          Swal.fire({
            title: "Propietario registrado correctamente",
            icon: "success",
            draggable: true
          });
          // Redirigir a la lista después del registro exitoso
          this.router.navigate(['/dashboards/owners/list']);
        }
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  }

  goBack() {
    this.router.navigate(['/dashboards/owners/list'])
  }
}
