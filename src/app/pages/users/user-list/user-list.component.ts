import { Component } from '@angular/core';
import {usersRegisterDTO} from '../../../interface/users-interface';

@Component({
  selector: 'app-user-list',
  imports: [],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent {

   users: usersRegisterDTO [] =[]

  editUser(id: number | null) {
    if (id === null) return;
    // lógica
  }

  deleteUser(id: number | null) {
    if (id === null) return;
    // lógica
  }



}
