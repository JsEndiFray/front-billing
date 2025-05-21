import { Component } from '@angular/core';
import {usersRegister} from '../../../interface/users-interface';

@Component({
  selector: 'app-user-list',
  imports: [],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent {

   users: usersRegister[]=[]

  editUser(id: number) {


  }

  deleteUser(id: number) {

  }



}
