import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { WatchlistService } from '../../services/watchlist.service';

@Component({
    selector: 'app-watchlist',
    standalone: true,
    imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule, MatTooltipModule, RouterModule],
    templateUrl: './watchlist.component.html',
    styleUrls: ['./watchlist.component.scss']
})
export class WatchlistComponent implements OnInit {

    watchlist: any[] = [];
    displayedColumns: string[] = ['image', 'name', 'set', 'price', 'target', 'notes', 'actions'];

    constructor(
        private watchlistService: WatchlistService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadWatchlist();
    }

    loadWatchlist() {
        this.watchlistService.getWatchlist().subscribe({
            next: (data) => {
                this.watchlist = data;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error loading watchlist', err)
        });
    }

    removeItem(id: string) {
        if (confirm('Remover da Watchlist?')) {
            this.watchlistService.removeFromWatchlist(id).subscribe(() => {
                this.loadWatchlist();
            });
        }
    }
}
