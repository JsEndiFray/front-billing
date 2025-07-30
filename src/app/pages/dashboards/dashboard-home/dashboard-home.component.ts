import { Component } from '@angular/core';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-dashboard-home',
  imports: [
    RouterLink
  ],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.css'
})
export class DashboardHomeComponent {

  // Aquí puedes cargar datos reales de estadísticas
  // this.loadStats();


// Métodos para cargar datos reales (implementar según tu backend)
// private loadStats(): void {
//   // Cargar estadísticas desde el servicio
// }

}
