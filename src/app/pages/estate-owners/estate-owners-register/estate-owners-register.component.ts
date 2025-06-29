import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {EstatesOwners} from '../../../interface/estates-owners-interface';
import {Estates} from '../../../interface/estates.interface';
import {Owners} from '../../../interface/owners-interface';
import {EstateOwnersService} from '../../../core/services/estate-owners-services/estate-owners.service';
import {Router} from '@angular/router';
import {EstatesService} from '../../../core/services/estates-services/estates.service';
import {OwnersService} from '../../../core/services/owners-services/owners.service';
import {HttpErrorResponse} from '@angular/common/http';
import {OwnersEstateValidatorService} from '../../../core/services/validator-services/owners-estate-validator.service';
import Swal from 'sweetalert2';

/**
 * Componente para crear nuevas relaciones inmueble-propietario
 * Permite asignar porcentajes de propiedad a propietarios
 */
@Component({
  selector: 'app-estate-owners',
  imports: [
    FormsModule
  ],
  templateUrl: './estate-owners-register.component.html',
  styleUrl: './estate-owners-register.component.css'
})
export class EstateOwnersRegisterComponent implements OnInit {

  // Objeto que guarda los datos de la nueva relación
  ownership: EstatesOwners = {
    id: null,
    estate_id: null,
    estate_name: '',           // Para mostrar información en la UI
    owners_id: null,
    owner_name: '',            // Para mostrar información en la UI
    ownership_percentage: null, // Porcentaje de propiedad
    date_create: '',
    date_update: ''
  }

  // Listas para los selectores del formulario
  estates: Estates[] = [];
  owners: Owners[] = [];

  // Control de estado de carga
  loading = false;

  constructor(
    private estateOwnerService: EstateOwnersService,
    private estateServices: EstatesService,
    private ownersServices: OwnersService,
    private router: Router,
    private ownersEstateValidatorService: OwnersEstateValidatorService,
  ) {
  }

  /**
   * Se ejecuta al cargar el componente
   * Carga las listas de inmuebles y propietarios para los selectores
   */
  ngOnInit(): void {
    this.getEstateList();
    this.getOwnersLIst();
  }

  /**
   * Obtiene lista de inmuebles para el selector
   */
  getEstateList() {
    this.estateServices.getAllEstate().subscribe({
      next: (data) => {
        this.estates = data;
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  }

  /**
   * Obtiene lista de propietarios para el selector
   */
  getOwnersLIst() {
    this.ownersServices.getOwners().subscribe({
      next: (data) => {
        this.owners = data;
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  }

  /**
   * Registra una nueva relación inmueble-propietario
   * Valida datos antes de enviar al servidor
   */
  register() {
    // Limpiar espacios y preparar datos
    const cleanData = this.ownersEstateValidatorService.cleanData(this.ownership);

    // Validar que todos los campos estén correctos
    const validation = this.ownersEstateValidatorService.validateEstateOwners(cleanData)
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error!',
        text: validation.message,
        icon: 'error'
      });
      return;
    }

    // Crear objeto con solo los datos necesarios para el servidor
    const newOwnersEstate: EstatesOwners = {
      estate_id: Number(this.ownership.estate_id),
      owners_id: Number(this.ownership.owners_id),
      ownership_percentage: Number(cleanData.ownership_percentage),
    };

    this.loading = true;

    // Enviar datos al servidor para crear la relación
    this.estateOwnerService.createEstateOwners(newOwnersEstate).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Relación registrada correctamente',
            icon: 'success'
          });
          // Regresar a la lista después del registro exitoso
          this.router.navigate(['/dashboard/estates-owners/list']);
        }
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
        this.loading = false;
      }
    });
  }

  /**
   * Cancela el registro y regresa a la lista
   */
  goBack() {
    this.router.navigate(['/dashboard/estates-owners/list']);
  }
}
