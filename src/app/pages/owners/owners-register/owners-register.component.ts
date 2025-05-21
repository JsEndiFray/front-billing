import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Owners} from '../../../interface/owners-interface';

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
    id: 0,
    name: '',
    lastname: '',
    email: '',
    nif: '',
    address: '',
    postal_code: '',
    location: '',
    province: '',
    country: ''
  }

}
