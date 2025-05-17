import {Component, OnInit} from '@angular/core';
import {EstateResponse, Estates} from '../../../interface/estates.interface';
import {EstateService} from '../../../core/services/estate-services/estate.service';
import {HttpErrorResponse} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';


@Component({
  selector: 'app-estates-list',
  standalone: true,
  imports: [FormsModule,
  ],
  templateUrl: './estates-list.component.html',
  styleUrl: './estates-list.component.css'
})
export class EstatesListComponent implements OnInit {
  //para monstrar el listado
  estates: Estates[] = [];

  constructor(
    private estateService: EstateService,
    private router: Router,) {
  }

  ngOnInit(): void {
    this.getListEstate();
  }


  editEstate(id: number | null) {
    if (id !== null) {
      this.router.navigate(['/estates/edit', id]);
    }
  }

  deleteEstate(id: number | null) {
  }

  //conexión DB

  //Listado de los inmuebles
  getListEstate() {
    this.estateService.getAllEstate().subscribe({
      next: (data: EstateResponse) => {
        this.estates = data.estate;
      }, error: (e: HttpErrorResponse) => {
      }
    });
  }


}
