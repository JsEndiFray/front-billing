import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Estates} from '../../../interface/estates.interface';
import Swal from 'sweetalert2';
import {EstatesService} from '../../../core/services/estates-services/estates.service';
import {HttpErrorResponse} from '@angular/common/http';
import {Router} from '@angular/router';
import {EstatesValidatorService} from '../../../core/services/validator-services/estates-validator.service';

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

  constructor(
    private estateService: EstatesService,
    private router: Router,
    private estateValidatorServices: EstatesValidatorService,
  ) {
  }

  /**
   * Registra una nueva propiedad en el sistema
   * Valida todos los datos antes de enviar al servidor
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
      next: (data: Estates) => {
        Swal.fire({
          title: "Se ha registrado correctamente.",
          icon: "success",
          draggable: true
        });
        // Redirigir a la lista después del registro exitoso
        this.router.navigate(['/dashboard/estates/list']);
      }, error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      }
    })
  }

  goBack(){
    this.router.navigate(['/dashboard/estates/list'])
  }
}
