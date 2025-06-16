import {Component, OnInit} from '@angular/core';
import {Owners} from '../../../interface/owners-interface';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {OwnersService} from '../../../core/services/owners-services/owners.service';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from 'sweetalert2';
import {SearchService} from '../../../core/services/search-services/search.service';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import {Router} from '@angular/router';

@Component({
  selector: 'app-owners-list',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    DataFormatPipe
  ],
  templateUrl: './owners-list.component.html',
  styleUrl: './owners-list.component.css'
})
export class OwnersListComponent implements OnInit {
  // Datos que se muestran en la tabla (solo la página actual)
  owners: Owners[] = [];

  // Lista completa de inmubeles (datos originales)
  allOwners: Owners[] = [];

//tèrmino de búsqueda
  searchTerm: string = '';

  constructor(
    private ownersService: OwnersService,
    private searchService: SearchService,
    private router: Router,
  ) {
  }

  ngOnInit(): void {
    this.getListOwner();
  }

  //listado de propietarios
  getListOwner() {
    this.ownersService.getOwners().subscribe({
      next: (data) => {
        this.owners = data;
        this.allOwners = data;
      }, error: (e: HttpErrorResponse) => {
      }

    })

  }

  //método de flitros
  filterOwners() {
    this.owners = this.searchService.filterWithFullName(
      this.allOwners,
      this.searchTerm,
      'name',
      'lastname',
      ['identification', 'phone']
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterOwners();
  }

  //Limpiar el término de búsqueda y mostrar todos los clientes
  onSearchChange() {
    this.filterOwners();
  }


  editOwner(id: number) {
    this.router.navigate(['/dashboard/owners/edit', id]);
  }

  deleteOwner(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ownersService.deleteOwner(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado.',
              text: 'Propietario eliminado correctamente',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
            this.getListOwner();
          }, error: (e: HttpErrorResponse) => {
          }
        })
      }
    })
  }


}
