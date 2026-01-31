import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // Import Location
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { SearchComponent } from '../search/search.component';
import { AuthService } from '../../services/auth.service';
import { CardService } from '../../services/card.service';
import { FilterService } from '../../services/filter.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, SearchComponent, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  // ... (previous properties)
  topRisers: any[] = [];
  topFallers: any[] = [];
  isLoading: boolean = true;
  isSearching: boolean = false;
  searchResults: any[] = [];
  searchQuery: string = '';
  isLoggedIn: boolean = false;
  isAdmin: boolean = false; // Admin flag

  cardBackUrl = 'https://upload.wikimedia.org/wikipedia/en/a/a4/Magic_the_gathering-card_back.jpg';

  // ... (previous properties)

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cardService: CardService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private location: Location,
    private filterService: FilterService // Inject FilterService
  ) { }

  isMenuOpen: boolean = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.authService.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.header-menu-wrapper');
    if (!clickedInside && this.isMenuOpen) {
      this.isMenuOpen = false;
    }
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: any) => {
      this.isLoggedIn = !!user;
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
            priceChangePercentage: 0, // Search results don't usually have 24h change data in this endpoint
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
      // id: identity (commander color), c: color.
      // Generic usage usually means "color includes". id: is stricter for commander.
      // Scryfall: c=w means exactly white. c>=w means white plus others. 
      // Let's use simple inclusive 'c:' logic joined.
      // Actually, user often wants logic OR or AND.
      // Standard advanced search: "c:w or c:u" vs "c:wu".
      // Let's go with "Identity includes selected" -> id>=...
      // Or simply append them. c:w c:u implies AND (must be both).
      // Let's construct a "c:" param. 
      // Using 'id' is often safer for "I want a deck with these colors".
      // But for searching a specific card, let's just append the string.
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
      // Usually types are AND? "Creature Artifact"? Or OR?
      // Checkboxes usually imply OR for categories, but AND for combination.
      // Let's assume user wants ANY of the selected types.
      queryParts.push('(' + typeQuery.join(' or ') + ')');
    }

    const finalQuery = queryParts.join(' ');
    console.log('Query construída:', finalQuery);

    // We execute search directly, effectively bypassing the simple "q=" URL parameter for filter nuance,
    // OR we update the URL. Updating URL is better for shareability.
    // But our search component binds to queryParams 'q'. 
    // If we update 'q' with complex syntax, it works!

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