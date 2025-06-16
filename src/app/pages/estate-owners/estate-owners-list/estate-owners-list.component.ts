import {Component, OnInit} from '@angular/core';
import {EstatesOwners} from '../../../interface/estates-owners-interface';
import {DataFormatPipe} from '../../../shared/pipe/data-format.pipe';
import {EstateOwnersService} from '../../../core/services/estate-owners-services/estate-owners.service';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
  selector: 'app-estate-owners-list',
  imports: [
    DataFormatPipe
  ],
  templateUrl: './estate-owners-list.component.html',
  styleUrl: './estate-owners-list.component.css'
})
export class EstateOwnersListComponent implements OnInit {

  estateOwners: EstatesOwners[] = [];

  constructor(
    private estateOwnersService: EstateOwnersService,
    private router: Router,
  ) {

  }

  ngOnInit(): void {
    this.getAllEstateOwners();
  }

  //obneter listado
  getAllEstateOwners() {
    this.estateOwnersService.getAllOwnerships().subscribe({
      next: (data) => {
        this.estateOwners = data;
      }, error: (e: HttpErrorResponse) => {
      }
    })
  }

  editEstateOwners(id: number) {
    this.router.navigate(['/dashboard/estates-owners/edit', id])
  }

  deleteEstateOwners(id: number) {
    this.router.navigate(['/dashboard/estates-owners/list'])
  }


}
