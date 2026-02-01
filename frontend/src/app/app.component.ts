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

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, SearchComponent, CommonModule, Footer, MatIconModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  isHomePage: boolean = true;
  isLoggedIn: boolean = false;
  isAdmin: boolean = false;
  isAuthPage: boolean = false;

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

  toggleNotifications() {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    if (this.isNotificationsOpen) {
      this.isMenuOpen = false;
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
    if (!target.closest('.notification-wrapper') && this.isNotificationsOpen) {
      this.isNotificationsOpen = false;
    }
  }

  constructor(
    private router: Router,
    private cardService: CardService,
    private authService: AuthService,
    private notificationService: NotificationService, // Inject Service
    private cdr: ChangeDetectorRef
  ) {
    // Initialize Observables
    this.unreadCount$ = this.notificationService.unreadCount$;
    this.notifications$ = this.notificationService.notifications$;

    // Monitora autenticação
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.isAdmin = this.authService.isAdmin();
      if (this.isLoggedIn) {
        this.notificationService.refresh(); // Fetch on login
      }
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