import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {EstatesOwners} from '../../../interface/estates-owners-interface';

@Component({
  selector: 'app-ownership',
  imports: [
    FormsModule
  ],
  templateUrl: './ownership-register.component.html',
  styleUrl: './ownership-register.component.css'
})
export class OwnershipRegisterComponent {

  estates: any[] = [];
  owners: any[] = [];

  ownership: EstatesOwners = {
    id: 0,
    estate_id: null,
    owners_id: null,
    ownership_precent: null

  }


}
