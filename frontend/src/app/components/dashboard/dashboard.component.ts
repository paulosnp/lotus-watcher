import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // Import Location
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { SearchComponent } from '../search/search.component';
import { AuthService } from '../../services/auth.service';
import { CardService } from '../../services/card.service';
import { FilterService } from '../../services/filter.service';

import { NotificationService } from '../../services/notification.service'; // Import NotificationService
import { Notification } from '../../models/notification.model'; // Import Notification Model
import { Observable } from 'rxjs'; // Import Observable

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, SearchComponent, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  topRisers: any[] = [];
  topFallers: any[] = [];
  isLoading: boolean = true;
  isSearching: boolean = false;
  searchResults: any[] = [];
  searchQuery: string = '';
  isLoggedIn: boolean = false;
  isAdmin: boolean = false; // Admin flag
  userAvatar: string | null = null; // Fix TS2339

  cardBackUrl = 'https://upload.wikimedia.org/wikipedia/en/a/a4/Magic_the_gathering-card_back.jpg';

  // Notification State
  isNotificationsOpen = false;
  unreadCount$: Observable<number>;
  notifications$: Observable<Notification[]>;
  isMenuOpen: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cardService: CardService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private location: Location,
    private filterService: FilterService,
    private notificationService: NotificationService
  ) {
    // Initialize Observables
    this.unreadCount$ = this.notificationService.unreadCount$;
    this.notifications$ = this.notificationService.notifications$;
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) this.isNotificationsOpen = false;
  }

  toggleNotifications() {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    if (this.isNotificationsOpen) {
      this.isMenuOpen = false;
      this.notificationService.refresh();
      // Mark all as read when opening
      this.notificationService.markAllAsRead().subscribe();
    }
  }

  markAsRead(id: string, event?: Event) {
    if (event) event.stopPropagation();
    this.notificationService.markAsRead(id).subscribe();
  }

  deleteNotification(id: string, event: Event) {
    event.stopPropagation(); // Prevent triggering markAsRead or other clicks
    this.notificationService.delete(id).subscribe();
  }

  logout() {
    this.authService.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.home-menu-wrapper');
    // If clicked OUTSIDE the whole wrapper
    if (!clickedInside) {
      this.isMenuOpen = false;
      this.isNotificationsOpen = false;
    }
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: any) => {
      this.isLoggedIn = !!user;
      this.userAvatar = user ? user.avatar : null;
      this.isAdmin = this.authService.isAdmin();
    });

    // Subscribe to Filter Service
    this.filterService.showFilters$.subscribe(visible => {
      this.showFilters = visible;
      this.cdr.detectChanges(); // Ensure UI updates
    });

    this.route.queryParams.subscribe((params: any) => {
      this.searchQuery = params['q'];
      if (this.searchQuery) {
        this.isSearching = true;
        this.executeSearch(this.searchQuery);
      } else {
        this.isSearching = false;
        this.carregarDadosMercado();
      }
    });
  }

  executeSearch(query: string) {
    this.isLoading = true;
    this.searchResults = [];
    this.cdr.detectChanges();

    this.cardService.searchCards(query).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.searchResults = response.data.map((card: any) => ({
            id: card.id,
            name: card.name,
            setName: card.set_name,
            priceUsd: card.prices?.usd || '0.00',
            priceChangePercentage: 0,
            imageUrl: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || 'https://i.imgur.com/LdOBU1I.jpg'
          }));
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erro na busca:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  carregarDadosMercado() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.cardService.getMarketOverview().subscribe({
      next: (data: any) => {
        if (data && data.risers) {
          this.topRisers = data.risers;
        } else {
          this.topRisers = [];
        }

        if (data && data.fallers) {
          this.topFallers = data.fallers;
        } else {
          this.topFallers = [];
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erro ao carregar mercado:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  irParaDetalhes(id: string) {
    if (id) {
      this.router.navigate(['/card', id]);
    }
  }

  onRandomCard() {
    this.cardService.getRandomCard().subscribe((card: any) => {
      if (card && card.id) {
        this.router.navigate(['/card', card.id]);
      }
    });
  }

  goBack() {
    this.location.back();
  }

  // --- FILTERS ---
  showFilters: boolean = false;

  filterState = {
    colors: { w: false, u: false, b: false, r: false, g: false, c: false },
    rarities: { common: false, uncommon: false, rare: false, mythic: false },
    types: {
      creature: false, instant: false, sorcery: false,
      enchantment: false, artifact: false, planeswalker: false, land: false
    }
  };

  toggleFilters() {
    this.filterService.toggleFilters();
  }

  applyFilters() {
    let queryParts: string[] = [];

    // Base query (search term)
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      queryParts.push(this.searchQuery);
    }

    // Colors
    let colorQuery: string[] = [];
    if (this.filterState.colors.w) colorQuery.push('w');
    if (this.filterState.colors.u) colorQuery.push('u');
    if (this.filterState.colors.b) colorQuery.push('b');
    if (this.filterState.colors.r) colorQuery.push('r');
    if (this.filterState.colors.g) colorQuery.push('g');
    if (this.filterState.colors.c) colorQuery.push('c');

    if (colorQuery.length > 0) {
      queryParts.push('c:' + colorQuery.join(''));
    }

    // Rarities
    let rarityQuery: string[] = [];
    if (this.filterState.rarities.common) rarityQuery.push('r:common');
    if (this.filterState.rarities.uncommon) rarityQuery.push('r:uncommon');
    if (this.filterState.rarities.rare) rarityQuery.push('r:rare');
    if (this.filterState.rarities.mythic) rarityQuery.push('r:mythic');

    if (rarityQuery.length > 0) {
      queryParts.push('(' + rarityQuery.join(' or ') + ')');
    }

    // Types
    let typeQuery: string[] = [];
    if (this.filterState.types.creature) typeQuery.push('t:creature');
    if (this.filterState.types.instant) typeQuery.push('t:instant');
    if (this.filterState.types.sorcery) typeQuery.push('t:sorcery');
    if (this.filterState.types.enchantment) typeQuery.push('t:enchantment');
    if (this.filterState.types.artifact) typeQuery.push('t:artifact');
    if (this.filterState.types.planeswalker) typeQuery.push('t:planeswalker');
    if (this.filterState.types.land) typeQuery.push('t:land');

    if (typeQuery.length > 0) {
      queryParts.push('(' + typeQuery.join(' or ') + ')');
    }

    const finalQuery = queryParts.join(' ');

    if (finalQuery.trim() === '') return;

    this.isSearching = true;
    this.searchResults = []; // Clear previous
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: finalQuery },
      queryParamsHandling: 'merge'
    });
  }

  // Helper for FormsModule
  updateFilter(category: string, key: string) {
    // @ts-ignore
    this.filterState[category][key] = !this.filterState[category][key];
  }
}