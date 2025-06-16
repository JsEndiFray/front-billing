import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Owners} from '../../../interface/owners-interface';
import {ActivatedRoute, Router} from '@angular/router';
import {OwnersService} from '../../../core/services/owners-services/owners.service';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';
import {OwnersValidatorService} from '../../../core/services/validator-services/owners-validator.service';

@Component({
  selector: 'app-owners-edit',
  imports: [
    FormsModule
  ],
  templateUrl: './owners-edit.component.html',
  styleUrl: './owners-edit.component.css'
})
export class OwnersEditComponent implements OnInit {

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

  ngOnInit(): void {
    // Obtener ID de la ruta
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        // Cargo los campos del cliente
        this.ownersService.getOwnerById(id).subscribe({
          next: (data) => {
            this.owner = data;
          }, error: (e: HttpErrorResponse) => {
          }
        });
      }
    });
  };

  updateOwner() {
    //verifica id
    if (this.owner.id == null) {
      Swal.fire({
        title: 'Error',
        text: 'ID de usuario no válido.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }
    //Limpiar y transformar datos
    const cleanOwners = this.ownerValidator.cleanOwnerData(this.owner);
    //validar campos requeridos
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
    this.ownersService.updateOwners(this.owner.id, cleanOwners).subscribe({
      next: (data) => {
        this.owner = data;
        Swal.fire({
          title: '¡Éxito!',
          text: 'Propietario actualizado correctamente.',
          icon: 'success',
          confirmButtonText: 'Ok'
        });
        this.router.navigate(['/dashboard/owners/list'])
      }, error: (e: HttpErrorResponse) => {
      }
    })
  }

  goBack() {
    this.router.navigate(['/dashboard/owners/list'])
  }

}


