import {Component} from '@angular/core';
import {Bills, BillsList} from '../../../interface/bills-interface';

@Component({
  selector: 'app-bills-list',
  imports: [],
  templateUrl: './bills-list.component.html',
  styleUrl: './bills-list.component.css'
})
export class BillsListComponent {

  bills: BillsList[] = [];

  editBill(id: number) {
  }

  deleteBill(id: number) {
  }

}
