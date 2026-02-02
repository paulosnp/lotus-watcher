import { Component, HostListener, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon'; // Import MatIconModule
import { SearchComponent } from './components/search/search.component';
import { Footer } from './components/footer/footer';
import { filter } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { CardService } from './services/card.service';
import { AuthService } from './services/auth.service';

import { NotificationService } from './services/notification.service'; // Import NotificationService
import { Notification } from './models/notification.model'; // Import Notification Model
import { TranslatePipe } from './pipes/translate.pipe'; // Import Pipe
import { LanguageService } from './services/language.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, SearchComponent, CommonModule, Footer, MatIconModule, TranslatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  isHomePage: boolean = true;
  isLoggedIn: boolean = false;
  isAdmin: boolean = false;
  isAuthPage: boolean = false;
  userAvatar: string | null = null;

  // Menu States
  isMenuOpen: boolean = false;
  isNotificationsOpen: boolean = false;

  // Notification Data
  unreadCount$: Observable<number>;
  notifications$: Observable<Notification[]>;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) this.isNotificationsOpen = false;
  }

  toggleNotifications(keepMenuOpen: boolean = false) {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    if (this.isNotificationsOpen) {
      if (!keepMenuOpen) {
        this.isMenuOpen = false;
      }
      this.notificationService.refresh();
    }
  }

  markAsRead(id: string) {
    this.notificationService.markAsRead(id).subscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Close Menu
    if (!target.closest('.header-menu-wrapper') && this.isMenuOpen) {
      this.isMenuOpen = false;
    }

    // Close Notifications
    // Allow clicks inside header-menu-wrapper (mobile list) to keep notifications open
    if (!target.closest('.notification-wrapper') && !target.closest('.header-menu-wrapper') && this.isNotificationsOpen) {
      this.isNotificationsOpen = false;
    }
  }

  // Language
  currentLang;

  toggleLanguage() {
    this.languageService.toggleLanguage();
  }

  constructor(
    private router: Router,
    private cardService: CardService,
    private authService: AuthService,
    public notificationService: NotificationService,
    private languageService: LanguageService, // Inject Language Service
    private cdr: ChangeDetectorRef
  ) {
    this.currentLang = this.languageService.currentLang;

    // Initialize Observables
    this.unreadCount$ = this.notificationService.unreadCount$;
    this.notifications$ = this.notificationService.notifications$;

    // Monitora autenticação
    this.authService.currentUser$.subscribe(user => {
      // Fix NG0100: Defer update to avoid "ExpressionChanged" if child triggers this update during check
      setTimeout(() => {
        this.isLoggedIn = !!user;
        this.isAdmin = this.authService.isAdmin();
        this.userAvatar = user ? user.avatar : null;
        if (this.isLoggedIn) {
          this.notificationService.refresh(); // Fetch on login
        }
        this.cdr.detectChanges(); // Ensure view updates after delay
      }, 0);
    });

    // Monitora cada troca de página
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      this.isHomePage = (url === '/');
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
        if (card && card.id) {
          this.router.navigate(['/card', card.id]);
        }
        // Fix NG0100: Wrap in setTimeout to ensure it doesn't conflict with current check cycle
        setTimeout(() => {
          this.isLoadingRandom = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.isLoadingRandom = false;
          this.cdr.detectChanges();
        });
      }
    });
  }
}