import {Component} from '@angular/core';
import {EstatesOwners} from '../../../interface/estates-owners-interface';

@Component({
  selector: 'app-ownership-list',
  imports: [],
  templateUrl: './ownership-list.component.html',
  styleUrl: './ownership-list.component.css'
})
export class OwnershipListComponent {

  ownerships: EstatesOwners[] = []

  editOwnership(ownerships: any){}
  deleteOwnership(ownerships: any){}
}
