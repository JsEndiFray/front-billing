import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {EstatesOwners} from '../../../interface/estates-owners-interface';
import {Estates} from '../../../interface/estates.interface';
import {Owners} from '../../../interface/owners-interface';
import {EstateOwnersService} from '../../../core/services/estate-owners-services/estate-owners.service';
import {ActivatedRoute, Router} from '@angular/router';
import {EstatesService} from '../../../core/services/estates-services/estates.service';
import {OwnersService} from '../../../core/services/owners-services/owners.service';
import {HttpErrorResponse} from '@angular/common/http';
import {OwnersEstateValidatorService} from '../../../core/services/validator-services/owners-estate-validator.service';
import Swal from 'sweetalert2';

/**
 * Componente para registrar relaciones propiedad-propietario
 * Maneja la asignación de porcentajes de propiedad
 */
@Component({
  selector: 'app-estate-owners',
  imports: [
    FormsModule  // Para formularios template-driven
  ],
  templateUrl: './estate-owners-register.component.html',
  styleUrl: './estate-owners-register.component.css'
})
export class EstateOwnersRegisterComponent implements OnInit {

  /**
   * Modelo principal del formulario
   * Incluye campos de visualización (estate_name, owner_name) y datos relacionales
   */
  ownership: EstatesOwners = {
    id: null,
    estate_id: null,
    estate_name: '',           // Para mostrar en UI
    owners_id: null,
    owner_name: '',            // Para mostrar en UI
    ownership_percentage: null, // Porcentaje de propiedad
    date_create: '',
    date_update: ''
  }

  // Datos para dropdowns
  estates: Estates[] = [];
  owners: Owners[] = [];

  // Control de estado UI
  loading = false;

  constructor(
    private estateOwnerService: EstateOwnersService,
    private estateServices: EstatesService,
    private ownersServices: OwnersService,
    private router: Router,
    private ownersEstateValidatorService: OwnersEstateValidatorService,
  ) {
  }

  ngOnInit(): void {
    // Cargar datos para dropdowns al inicializar
    this.getEstateList();
    this.getOwnersLIst();
  }

  // ========================================
  // CARGA DE DATOS PARA DROPDOWNS
  // ========================================

  /**
   * Obtiene lista de propiedades para dropdown
   */
  getEstateList() {
    this.estateServices.getAllEstate().subscribe({
      next: (data) => {
        this.estates = data;
      },
      error: (e: HttpErrorResponse) => {
      }
    })
  }

  /**
   * Obtiene lista de propietarios para dropdown
   */
  getOwnersLIst() {
    this.ownersServices.getOwners().subscribe({
      next: (data) => {
        this.owners = data;
      },
      error: (e: HttpErrorResponse) => {
      }
    })
  }

  // ========================================
  // LÓGICA DE REGISTRO CON VALIDACIONES
  // ========================================

  /**
   * Registra relación propiedad-propietario con validaciones múltiples
   * Proceso: limpiar → validar → crear objeto → enviar
   */
  register() {
    //Limpiar datos usando servicio validador
    const cleanData = this.ownersEstateValidatorService.cleanData(this.ownership);

    //Validación principal de estructura y reglas de negocio
    const validation = this.ownersEstateValidatorService.validateEstateOwners(cleanData)
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error!',
        text: validation.message,
        icon: 'error'
      });
      return;
    }


    //Crear objeto limpio para envío (solo campos necesarios)
    const newOwnersEstate: EstatesOwners = {
      estate_id: Number(this.ownership.estate_id),
      owners_id: Number(this.ownership.owners_id),
      ownership_percentage: Number(cleanData.ownership_percentage),
    };
    this.loading = true;

    this.estateOwnerService.createOwnersEstates(newOwnersEstate).subscribe({
      next: (data) => {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Relación registrada correctamente',
          icon: 'success'
        });
        this.router.navigate(['/dashboard/estates-owners/list']);
      },
      error: (e: HttpErrorResponse) => {
      }
    });
  }

  /**
   * Navegación de regreso a lista
   */
  goBack() {
    this.router.navigate(['/dashboard/estates-owners/list']);
  }
}

