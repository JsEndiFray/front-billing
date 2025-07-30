import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Owners} from '../../../interface/owners-interface';
import {ActivatedRoute, Router} from '@angular/router';
import {OwnersService} from '../../../core/services/owners-services/owners.service';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';
import {OwnersValidatorService} from '../../../core/services/validator-services/owners-validator.service';

/**
 * Componente para editar propietarios existentes
 * Permite modificar datos personales, contacto y dirección
 */
@Component({
  selector: 'app-owners-edit',
  imports: [
    FormsModule
  ],
  templateUrl: './owners-edit.component.html',
  styleUrl: './owners-edit.component.css'
})
export class OwnersEditComponent implements OnInit {

  // Objeto que guarda todos los datos del propietario
  owner: Owners = {
    id: 0,
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
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ownersService: OwnersService,
    private ownerValidator: OwnersValidatorService,
  ) {
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
              this.owner = data[0];
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
    if (this.owner.id == null) {
      Swal.fire({
        title: 'Error',
        text: 'ID de usuario no válido.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    // Limpiar espacios y preparar datos
    const cleanOwners = this.ownerValidator.cleanOwnerData(this.owner);

    // Validar que todos los campos estén correctos
    const validation = this.ownerValidator.validateOwners(cleanOwners);
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error!',
        text: validation.message,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    // Enviar datos actualizados al servidor
    this.ownersService.updateOwners(this.owner.id, cleanOwners).subscribe({
      next: (data) => {
        if (data && data.length) {
          this.owner = data[0];
          Swal.fire({
            title: '¡Éxito!',
            text: 'Propietario actualizado correctamente.',
            icon: 'success',
            confirmButtonText: 'Ok'
          });
          // Regresar a la lista de propietarios
          this.router.navigate(['/dashboards/owners/list'])
        }

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
