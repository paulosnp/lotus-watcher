import { Component, HostListener, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon'; // Import MatIconModule
import { SearchComponent } from './components/search/search.component';
import { Footer } from './components/footer/footer';
import { filter } from 'rxjs/operators';
import { CardService } from './services/card.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, SearchComponent, CommonModule, Footer, MatIconModule], // Add RouterModule
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  isHomePage: boolean = true;
  isLoggedIn: boolean = false;
  isAdmin: boolean = false;
  isAuthPage: boolean = false;
  isMenuOpen: boolean = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.header-menu-wrapper');
    if (!clickedInside && this.isMenuOpen) {
      this.isMenuOpen = false;
    }
  }

  constructor(
    private router: Router,
    private cardService: CardService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    // Monitora autenticação
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.isAdmin = this.authService.isAdmin();
    });

    // Monitora cada troca de página
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      // Se a URL for '/', estamos na Home
      this.isHomePage = (url === '/');
      // Verifica se é pagina de auth OU pagina de conta
      this.isAuthPage = (url.startsWith('/login') || url.startsWith('/register') || url.startsWith('/verify') || url.startsWith('/account'));
    });
  }

  logout() {
    this.authService.logout();
  }

  isLoadingRandom: boolean = false;

  onRandomCard() {
    if (this.isLoadingRandom) return;

    this.isLoadingRandom = true;
    this.cardService.getRandomCard().subscribe({
      next: (card) => {
        this.isLoadingRandom = false;
        if (card && card.id) {
          this.router.navigate(['/card', card.id]);
        }
        this.cdr.detectChanges(); // Force update
      },
      error: () => {
        this.isLoadingRandom = false;
        this.cdr.detectChanges(); // Force update
      }
    });
  }
}