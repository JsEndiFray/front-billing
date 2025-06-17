import {Component, HostListener, OnInit} from '@angular/core';
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
  isScrolled: boolean = false;

  constructor(private router: Router, private authService: AuthService) {
  }

  ngOnInit(): void {
    // Escucha cambios de estado de autenticación
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });

    // Anima logo al cargar
    setTimeout(() => {
      this.animateLogo = true;
    }, 300);
  }

  // Detecta scroll para cambiar estilo del header
  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    this.isScrolled = window.pageYOffset > 50;
  }

  /**
   * Toggle login/logout con animación de logo
   */
  loginOrLogout() {
    if (this.isLoggedIn) {
      this.authService.logout();
    } else {
      this.router.navigate(['/login']);
    }

    // Anima logo en cambio de estado
    this.animateLogo = false;
    setTimeout(() => {
      this.animateLogo = true;
    }, 50);
  }
}
