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

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { WatchlistVersionDialogComponent } from './watchlist-version-dialog.component';

@Component({
    selector: 'app-watchlist',
    standalone: true,
    imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule, MatTooltipModule, RouterModule, MatSnackBarModule, FormsModule],
    templateUrl: './watchlist.component.html',
    styleUrls: ['./watchlist.component.scss']
})
export class WatchlistComponent implements OnInit {

    watchlist: any[] = [];
    displayedColumns: string[] = ['image', 'name', 'set', 'price', 'target', 'notes', 'actions'];

    isImporting = false;
    importText = '';
    isProcessingImport = false;

    constructor(
        private watchlistService: WatchlistService,
        private cdr: ChangeDetectorRef,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
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

    toggleImportPanel() {
        this.isImporting = !this.isImporting;
        if (!this.isImporting) this.importText = '';
    }

    processImport() {
        if (!this.importText.trim()) return;

        this.isProcessingImport = true;
        const lines = this.importText.split('\n').filter(l => l.trim().length > 0);

        this.watchlistService.batchImport(lines).subscribe({
            next: (res) => {
                this.loadWatchlist();
                this.isProcessingImport = false;
                this.isImporting = false;
                this.importText = '';

                // Show detailed result
                const addedCount = res.added.length;
                const notFoundCount = res.notFound.length;
                let msg = `${addedCount} cartas adicionadas.`;
                if (notFoundCount > 0) msg += ` ${notFoundCount} não encontradas.`;

                this.snackBar.open(msg, 'OK', { duration: 5000 });
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error(err);
                this.isProcessingImport = false;
                this.snackBar.open('Erro ao importar lista.', 'Fechar', { duration: 3000 });
                this.cdr.detectChanges();
            }
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

    openVersionSwap(item: any) {
        const dialogRef = this.dialog.open(WatchlistVersionDialogComponent, {
            width: '800px',
            panelClass: 'lotus-dialog-container',
            data: {
                cardId: item.card.id,
                cardName: item.card.name
            }
        });

        dialogRef.afterClosed().subscribe(newCardId => {
            if (newCardId && newCardId !== item.card.id) {
                // Update item with new Card ID
                this.watchlistService.updateItem(item.id, {
                    cardId: newCardId,
                    notes: item.notes,
                    targetPrice: item.targetPrice,
                    tag: item.tag
                }).subscribe({
                    next: () => {
                        this.snackBar.open('Versão alterada com sucesso!', 'OK', { duration: 3000 });
                        this.loadWatchlist();
                    },
                    error: (err) => {
                        console.error(err);
                        this.snackBar.open('Erro ao alterar versão.', 'Fechar', { duration: 3000 });
                    }
                });
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
