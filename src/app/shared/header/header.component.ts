import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from '../../core/services/auth-service/auth.service';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [
    NgClass
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isLoggedIn: boolean = false;
  animateLogo: boolean = false;

  constructor(private router: Router, private authService: AuthService) {
  }

  ngOnInit(): void {
    // Suscripción al servicio de autenticación
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });

    // Activar la animación del logo al cargar la página
    setTimeout(() => {
      this.animateLogo = true;
    }, 300);
  }

  loginOrLogout() {
    if (this.isLoggedIn) {
      this.authService.logout();
    } else {
      this.router.navigate(['/login']);
    }

    //Animar logo al iniciar/cerrar sesión
    this.animateLogo = false;
    setTimeout(() => {
      this.animateLogo = true;
    }, 50);
  }
}
