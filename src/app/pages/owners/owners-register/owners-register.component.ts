import {Component} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {OwnersService} from '../../../core/services/owners-services/owners.service';
import {Router} from '@angular/router';
import Swal from 'sweetalert2';
import {HttpErrorResponse} from '@angular/common/http';
import {ValidatorService} from '../../../core/services/validator-services/validator.service';

/**
 * Componente para registrar nuevos propietarios
 * Permite crear propietarios con datos completos de contacto y dirección
 */
@Component({
  selector: 'app-owners',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './owners-register.component.html',
  styleUrl: './owners-register.component.css'
})
export class OwnersRegisterComponent {

  // ==========================================
  // PROPIEDADES DE FORMULARIOS MÚLTIPLES
  // ==========================================

  ownersForm: FormGroup;

  constructor(
    private ownersServices: OwnersService,
    private router: Router,
    private validatorService: ValidatorService,
    private fb: FormBuilder,
  ) {
    this.ownersForm = this.fb.group({
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      identification: ['', Validators.required],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      postal_code: ['', [Validators.required, Validators.maxLength(5)]],
      location: ['', Validators.required],
      province: ['', Validators.required],
      country: ['ESPAÑA'],
      date_create: [''],
      date_update: ['']
    });
  }

  /**
   * Registra un nuevo propietario en el sistema
   * Valida todos los datos antes de enviar al servidor
   */
  createOwners() {

    if (!this.ownersForm.valid) {
      Swal.fire({
        title: 'Error!',
        text: 'Por favor, complete todos los campos requeridos',
        icon: 'error'
      });
      return;
    }
    // Aplica transformaciones automáticas al formulario de empleado:
    this.validatorService.applyTransformations(this.ownersForm, 'owner')

    //Usar directamente los valores del FormGroup
    const ownersData = this.ownersForm.value;

    // Validar que todos los campos estén correctos
    const validation = this.validatorService.validateOwner(ownersData);
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error!',
        text: validation.message,
        icon: 'error'
      });
      return;
    }

    // Enviar datos al servidor para crear propietario
    this.ownersServices.createOwners(ownersData).subscribe({
      next: (data) => {
        Swal.fire({
          title: "Propietario registrado correctamente",
          icon: "success",
          draggable: true
        });
        // Redirigir a la lista después del registro exitoso
        this.router.navigate(['/dashboards/owners/list']);

      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  }

  goBack() {
    this.router.navigate(['/dashboards/owners/list'])
  }
}
