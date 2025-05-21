import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Estates} from '../../../interface/estates.interface';
import Swal from 'sweetalert2';
import {EstateService} from '../../../core/services/estate-services/estate.service';
import {HttpErrorResponse} from '@angular/common/http';
import {Router} from '@angular/router';

@Component({
  selector: 'app-estates',
  imports: [
    FormsModule
  ],
  templateUrl: './estates-register.component.html',
  styleUrl: './estates-register.component.css'
})
export class EstatesRegisterComponent {

  constructor(
    private estateService: EstateService,
    private router: Router,) {
  }

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

  //Validador de formato para referencia catastral
  isValidRefCatFormat(refCat: string): boolean {
    return /^[0-9A-Z]{20}$/i.test(refCat);
  }

  createEstate() {
    // Convertir a mayúsculas
    this.estate.cadastral_reference = this.estate.cadastral_reference.toUpperCase();
    this.estate.address = this.estate.address.toUpperCase();
    this.estate.location = this.estate.location.toUpperCase();
    this.estate.province = this.estate.province.toUpperCase();
    this.estate.country = this.estate.country.toUpperCase();

    //Validación de campos requeridos
    if (!this.estate.cadastral_reference ||
      !this.estate.price ||
      !this.estate.address ||
      !this.estate.postal_code ||
      !this.estate.location ||
      !this.estate.province ||
      !this.estate.country ||
      !this.estate.surface
    ) {
      Swal.fire({
        title: 'Error!',
        text: 'Todos los campos son obligatorios.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }
    // Validación específica para la referencia catastral
    if (this.estate.cadastral_reference.length !== 20 || !this.isValidRefCatFormat(this.estate.cadastral_reference)) {
      Swal.fire({
        title: 'Error!',
        text: 'La referencia catastral debe tener exactamente 20 caracteres y solo puede contener números y letras.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    //objeto para el backend
    const newEstate: Estates = {
      cadastral_reference: this.estate.cadastral_reference,
      price: this.estate.price,
      address: this.estate.address,
      postal_code: this.estate.postal_code,
      location: this.estate.location,
      province: this.estate.province,
      country: this.estate.country,
      surface: this.estate.surface,
    }

    //CONEXION AL BACKEND
    this.estateService.createEstate(newEstate).subscribe({
      next: (data: Estates) => {
        Swal.fire({
          title: "Se ha registrado correctamente.",
          icon: "success",
          draggable: true
        });
        this.router.navigate(['/dashboard/estates/list']);
      }, error: (e: HttpErrorResponse) => {
      }
    })
  }

}
