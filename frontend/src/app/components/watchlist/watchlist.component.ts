import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { WatchlistService } from '../../services/watchlist.service';
import { MatDialog } from '@angular/material/dialog';
import { WatchlistDialogComponent } from './watchlist-dialog.component';

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
        private cdr: ChangeDetectorRef,
        private dialog: MatDialog
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

    editItem(item: any) {
        const dialogRef = this.dialog.open(WatchlistDialogComponent, {
            width: '450px',
            panelClass: 'lotus-dialog-container',
            data: { item: item }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadWatchlist();
            }
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
