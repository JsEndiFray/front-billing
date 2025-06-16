import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Owners} from '../../../interface/owners-interface';
import {OwnersService} from '../../../core/services/owners-services/owners.service';
import {OwnersValidatorService} from '../../../core/services/validator-services/owners-validator.service';
import {Router} from '@angular/router';
import Swal from 'sweetalert2';
import {HttpErrorResponse} from '@angular/common/http';


@Component({
  selector: 'app-owners',
  imports: [
    FormsModule
  ],
  templateUrl: './owners-register.component.html',
  styleUrl: './owners-register.component.css'
})
export class OwnersRegisterComponent {

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


  //registrar los propietarios
  createOwners() {

    const cleanOwners = this.ownersValidator.cleanOwnerData(this.owner);
    const validation = this.ownersValidator.validateOwners(cleanOwners)
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error!',
        text: validation.message,
        icon: 'error'
      });
      return;
    }
    this.ownersServices.createOwners(cleanOwners).subscribe({
      next: (data) => {
        Swal.fire({
          title: "Propietario registrado correctamente" ,
          icon: "success",
          draggable: true
        });
        this.router.navigate(['/dashboard/owners/list']);

      }, error: (e: HttpErrorResponse) => {
      }
    })
  }

}
