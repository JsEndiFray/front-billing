import { Component } from '@angular/core';
import {userListDTO} from '../../../interface/users-interface';

@Component({
  selector: 'app-user-list',
  imports: [],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent {

   users: userListDTO[]=[]

  editUser(id: number | null) {
    if (id === null) return;
    // lógica
  }

  deleteUser(id: number | null) {
    if (id === null) return;
    // lógica
  }



}
