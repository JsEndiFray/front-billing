import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Bills} from '../../../interface/bills-interface';

@Component({
  selector: 'app-bills',
  imports: [
    FormsModule
  ],
  templateUrl: './bills-register.component.html',
  styleUrl: './bills-register.component.css'
})
export class BillsRegisterComponent {
  estates: any[] = [];
  clients: any[] = [];
  owners: any[] = [];

  bill: Bills = {
    id: 0,
    bill_number: '',
    estate_id: null,
    clients_id: null,
    owners_id: null,
    date: '',
    tax_base: null,
    iva: null,
    irpf: null,
    total: null
  }


}
