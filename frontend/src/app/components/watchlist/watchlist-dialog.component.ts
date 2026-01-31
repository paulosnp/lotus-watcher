import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { WatchlistService } from '../../services/watchlist.service';

@Component({
    selector: 'app-watchlist-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
    template: `
    <h2 mat-dialog-title>Adicionar à Watchlist</h2>
    <mat-dialog-content>
      <div class="form-container">
        <p>Carta: <strong>{{ data.card.name }}</strong></p>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Preço Alvo (USD)</mat-label>
          <input matInput type="number" [(ngModel)]="targetPrice" placeholder="Ex: 5.00">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tag / Grupo</mat-label>
          <input matInput [(ngModel)]="tag" placeholder="Ex: Commander, Foil, Spec">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notas</mat-label>
          <textarea matInput [(ngModel)]="notes" rows="3" placeholder="Ex: Comprar para o deck X..."></textarea>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="isLoading">
        {{ isLoading ? 'Salvando...' : 'Salvar' }}
      </button>
    </mat-dialog-actions>
  `,
    styles: [`
    .form-container { display: flex; flex-direction: column; gap: 10px; min-width: 300px; }
    .full-width { width: 100%; }
  `]
})
export class WatchlistDialogComponent {
    targetPrice: number | null = null;
    notes: string = '';
    tag: string = '';
    isLoading = false;

    constructor(
        public dialogRef: MatDialogRef<WatchlistDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        privatewatchlistService: WatchlistService, // Inject service
        private watchlistService: WatchlistService // Proper inject
    ) { }

    save() {
        this.isLoading = true;
        const dto = {
            cardId: this.data.card.id,
            targetPrice: this.targetPrice || undefined,
            notes: this.notes,
            tag: this.tag
        };

        // We can assume user handles service call here OR we call it here.
        // Let's return data to parent to keep it clean? 
        // Or call service directly. Calling service directly is easier.

        this.watchlistService.addToWatchlist(dto).subscribe({
            next: () => {
                this.dialogRef.close(true);
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
            }
        });
    }
}
