import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {OwnersService} from '../../../core/services/owners-services/owners.service';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';
import {ValidatorService} from '../../../core/services/validator-services/validator.service';

/**
 * Componente para editar propietarios existentes
 * Permite modificar datos personales, contacto y dirección
 */
@Component({
  selector: 'app-owners-edit',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './owners-edit.component.html',
  styleUrl: './owners-edit.component.css'
})
export class OwnersEditComponent implements OnInit {

  // ==========================================
  // PROPIEDADES DE FORMULARIOS MÚLTIPLES
  // ==========================================

  ownersForm: FormGroup;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ownersService: OwnersService,
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
   * Se ejecuta al cargar el componente
   * Busca el propietario que se quiere editar
   */
  ngOnInit(): void {
    // Sacar el ID de la URL (ejemplo: /edit/123)
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        // Buscar los datos del propietario por su ID
        this.ownersService.getOwnerById(id).subscribe({
          next: (data) => {
            if (data && data.length > 0) {
              const owner = data[0];

              this.ownersForm.patchValue({
                name: owner.name,
                lastname: owner.lastname,
                email: owner.email,
                identification: owner.identification,
                phone: owner.phone,
                address: owner.address,
                postal_code: owner.postal_code,
                location: owner.location,
                province: owner.province,
                country: owner.country,
                date_update: owner.date_update

              })
            }
          }, error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        });
      }
    });
  };

  /**
   * Actualiza los datos del propietario
   * Valida información antes de enviar al servidor
   */
  updateOwner() {
    // Verificar que el propietario tenga ID válido
    if (!this.ownersForm.valid) {
      Swal.fire({
        title: 'Error!',
        text: 'Por favor, complete todos los campos requeridos',
        icon: 'error'
      });
      return;
    }

    // Aplica transformaciones automáticas al formulario de propiuetarios:
    this.validatorService.applyTransformations(this.ownersForm, 'owner');

    //Usar directamente los valores del FormGroup
    const ownersData = this.ownersForm.value;

    // Validar que todos los campos estén correctos
    const validation = this.validatorService.validateOwner(ownersData);
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error!',
        text: validation.message,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    //Usar ID de la ruta, no de una propiedad inexistente
    const ownersId = this.route.snapshot.params['id'];
    if (!ownersId) {
      Swal.fire({
        title: 'Error',
        text: 'ID del Propietario no es válido',
        icon: 'error'
      });
      return;
    }

    // Enviar datos actualizados al servidor
    this.ownersService.updateOwners(ownersId, ownersData).subscribe({
      next: (data) => {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Propietario actualizado correctamente.',
          icon: 'success',
          confirmButtonText: 'Ok'
        });
        // Regresar a la lista de propietarios
        this.router.navigate(['/dashboards/owners/list'])
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  }

  /**
   * Cancelar edición y regresar a la lista
   */
  goBack() {
    this.router.navigate(['/dashboards/owners/list'])
  }
}
