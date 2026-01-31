import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // Import Location
import { Router, RouterModule } from '@angular/router';
import { WatchlistService } from '../../services/watchlist.service';
import { Card } from '../../models/card.model';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-watchlist',
    standalone: true,
    imports: [CommonModule, MatIconModule, RouterModule],
    templateUrl: './watchlist.component.html',
    styleUrls: ['./watchlist.component.scss']
})
export class WatchlistComponent implements OnInit {

    watchlist: Card[] = [];

    constructor(
        private watchlistService: WatchlistService,
        private router: Router,
        private location: Location // Inject Location
    ) { }

    ngOnInit(): void {
        this.loadWatchlist();
    }

    goBack() {
        this.location.back();
    }

    loadWatchlist() {
        this.watchlist = this.watchlistService.getWatchlist();
    }

    remove(cardId: string, event: Event) {
        event.stopPropagation(); // Evita abrir os detalhes ao clicar em remover
        this.watchlistService.removeFromWatchlist(cardId);
        this.loadWatchlist();
    }

    goToDetails(cardId: string) {
        this.router.navigate(['/card', cardId]);
    }
}
