import {Component} from '@angular/core';
import {Owners} from '../../../interface/owners-interface';

@Component({
  selector: 'app-owners-list',
  imports: [],
  templateUrl: './owners-list.component.html',
  styleUrl: './owners-list.component.css'
})
export class OwnersListComponent {

  owners: Owners[] = [];


  editOwner(id: number) {}

  deleteOwner(id: number ) {}


}
