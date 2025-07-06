import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {EstatesOwners} from '../../../interface/estates-owners-interface';
import {Estates} from '../../../interface/estates.interface';
import {Owners} from '../../../interface/owners-interface';
import {ActivatedRoute, Router} from '@angular/router';
import {EstatesService} from '../../../core/services/estates-services/estates.service';
import {OwnersService} from '../../../core/services/owners-services/owners.service';
import {EstateOwnersService} from '../../../core/services/estate-owners-services/estate-owners.service';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';
import {OwnersEstateValidatorService} from '../../../core/services/validator-services/owners-estate-validator.service';

/**
 * Componente para editar relaciones inmueble-propietario
 * Permite modificar porcentajes de propiedad y gestionar las relaciones
 */
@Component({
  selector: 'app-estate-owners-edit',
  imports: [
    FormsModule
  ],
  templateUrl: './estate-owners-edit.component.html',
  styleUrl: './estate-owners-edit.component.css'
})
export class EstateOwnersEditComponent implements OnInit {

  // Objeto que guarda los datos de la relación inmueble-propietario
  estateOwners: EstatesOwners = {
    id: null,
    estate_id: null,
    estate_name: '',
    owners_id: null,
    owner_name: '',
    ownership_percentage: null,
    date_create: '',
    date_update: ''
  }

  // Listas para los selectores del formulario
  estates: Estates[] = [];
  owners: Owners[] = [];

  // Objetos completos de lo que está seleccionado actualmente
  selectedEstate: Estates | null = null;
  selectedOwner: Owners | null = null;

  // Variables de control del formulario
  isEditMode: boolean = false;          // Si estamos editando o creando
  originalPercentage: number = 0;       // Porcentaje original antes de editar
  totalPercentageForEstate: number = 0; // Total de porcentajes para validar

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private estateServices: EstatesService,
    private ownersServices: OwnersService,
    private estateOwnersService: EstateOwnersService,
    private ownersEstateValidatorService: OwnersEstateValidatorService,
  ) {
  }

  /**
   * Se ejecuta al cargar el componente
   * Determina si es modo edición o creación
   */
  ngOnInit(): void {
    // Verificar si viene un ID en la URL (modo edición)
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        // Modo edición - cargar datos existentes
        this.isEditMode = true;

        // Buscar los datos de la relación a editar
        this.estateOwnersService.getEstatesOwnersById(id).subscribe({
          next: (data) => {
            if (data && data.length > 0) {
              this.estateOwners = data[0];
              this.originalPercentage = data[0].ownership_percentage || 0;
            }
            // Cargar las listas y después buscar las relaciones
            this.loadDataAndFindRelations();

            // Buscar los objetos completos para mostrar información
            this.findSelectedEstate();
            this.findSelectedOwner();

          }, error: (e: HttpErrorResponse) => {
            // Error manejado por interceptor
          }
        });
      } else {
        // Modo creación - solo cargar las listas
        this.getEstateList();
        this.getOwnersLIst();
      }
    })
  }

  /**
   * Carga tanto inmuebles como propietarios y luego busca las relaciones
   * Necesario para modo edición cuando hay que mostrar datos seleccionados
   */
  loadDataAndFindRelations() {
    let estatesLoaded = false;
    let ownersLoaded = false;

    // Cargar lista de inmuebles
    this.estateServices.getAllEstate().subscribe({
      next: (data) => {
        this.estates = data;
        estatesLoaded = true;

        // Si ambas listas están cargadas, buscar las relaciones
        if (estatesLoaded && ownersLoaded) {
          this.findSelectedEstate();
          this.findSelectedOwner();
        }
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });

    // Cargar lista de propietarios
    this.ownersServices.getOwners().subscribe({
      next: (data) => {
        this.owners = data;
        ownersLoaded = true;

        // Si ambas listas están cargadas, buscar las relaciones
        if (estatesLoaded && ownersLoaded) {
          this.findSelectedEstate();
          this.findSelectedOwner();
        }
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    });
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
   * Actualiza la relación inmueble-propietario
   * Valida datos antes de enviar al servidor
   */
  updateOwnership() {
    // Verificar que la relación tenga ID válido
    if (this.estateOwners.id === null || this.estateOwners.id === undefined) {
      Swal.fire({
        title: 'Error!',
        text: 'ID de relación no válido.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    // Limpiar espacios y preparar datos
    const cleanData = this.ownersEstateValidatorService.cleanData(this.estateOwners);

    // Validar que todos los campos estén correctos
    const validation = this.ownersEstateValidatorService.validateEstateOwners(cleanData);
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error de validación',
        text: validation.message,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    // Enviar datos actualizados al servidor
    this.estateOwnersService.updateEstateOwners(this.estateOwners.id, cleanData).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.estateOwners = data[0];
          Swal.fire({
            title: '¡Éxito!',
            text: 'Relación inmueble-propietario actualizada correctamente.',
            icon: 'success',
            confirmButtonText: 'Ok'
          });
          // Regresar a la lista de relaciones
          this.router.navigate(['/dashboard/estates-owners/list']);
        }
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  }

  /**
   * Busca el inmueble completo que está seleccionado
   * Para mostrar información detallada en el formulario
   */
  findSelectedEstate() {
    this.selectedEstate = this.estates.find(estate => estate.id === this.estateOwners.estate_id) || null;
  }

  /**
   * Busca el propietario completo que está seleccionado
   * Para mostrar información detallada en el formulario
   */
  findSelectedOwner() {
    this.selectedOwner = this.owners.find(owner => owner.id === this.estateOwners.owners_id) || null;
  }

  /**
   * Cancela la edición y regresa a la lista
   */
  goBack() {
    this.router.navigate(['/dashboard/estates-owners/list']);
  }
}
