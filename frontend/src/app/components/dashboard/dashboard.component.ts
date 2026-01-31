import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // Import Location
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SearchComponent } from '../search/search.component';
import { AuthService } from '../../services/auth.service';
import { CardService } from '../../services/card.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, SearchComponent, RouterModule],
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
  isMenuOpen: boolean = false; // State for hamburger menu

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.authService.logout();
    this.isMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Verifica se o clique foi fora do menu wrapper
    const clickedInside = target.closest('.home-menu-wrapper');
    if (!clickedInside && this.isMenuOpen) {
      this.isMenuOpen = false;
    }
  }

  cardBackUrl = 'https://upload.wikimedia.org/wikipedia/en/a/a4/Magic_the_gathering-card_back.jpg';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cardService: CardService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private location: Location // Inject Location
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: any) => {
      this.isLoggedIn = !!user;
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
}