import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {EstatesOwners} from '../../../interface/estates-owners-interface';
import {Estates} from '../../../interface/estates.interface';
import {Owners} from '../../../interface/owners-interface';
import {ActivatedRoute, Router} from '@angular/router';
import {EstatesService} from '../../../core/services/estates-services/estates.service';
import {OwnersService} from '../../../core/services/owners-services/owners.service';
import {EstateOwnersService} from '../../../core/services/estate-owners-services/estate-owners.service';

@Component({
  selector: 'app-estate-owners-edit',
  imports: [
    FormsModule
  ],
  templateUrl: './estate-owners-edit.component.html',
  styleUrl: './estate-owners-edit.component.css'
})
export class EstateOwnersEditComponent implements OnInit {

  // Datos del formulario
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
  // Arrays para los dropdowns
  estates: Estates[] = [];
  owners: Owners[] = [];

  // Datos seleccionados actuales
  selectedEstate: Estates | null = null;
  selectedOwner: Owners | null = null;

  // Control de modo y validación
  isEditMode: boolean = false;
  originalPercentage: number = 0;
  totalPercentageForEstate: number = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private estatesService: EstatesService,
    private ownersService: OwnersService,
    private estateOwnersService: EstateOwnersService
  ) {
  }

  ngOnInit(): void {

  }

  onEstateChange() {
  }

  onOwnerChange() {
  }


  updateOwnership() {
  }


  goBack() {
    this.router.navigate(['/dashboard/estates-owners/list']);
  }

}
