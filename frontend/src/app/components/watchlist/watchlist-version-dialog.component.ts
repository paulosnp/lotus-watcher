import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CardService } from '../../services/card.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-watchlist-version-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  template: `
    <h2 mat-dialog-title>Escolha a Versão</h2>
    <mat-dialog-content class="version-content">
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Buscando versões...</p>
      </div>

      <div *ngIf="!isLoading && prints.length > 0" class="prints-grid">
        <div *ngFor="let print of prints" 
             class="print-item" 
             [class.selected]="print.id === currentCardId"
             (click)="selectVersion(print)">
          
          <img [src]="getImageUrl(print)" [alt]="print.set_name">
          <div class="print-info">
            <span class="set-name">{{ print.set_name }}</span>
            <span class="price" *ngIf="print.prices?.usd">\${{ print.prices.usd }}</span>
          </div>
          <div class="selected-overlay" *ngIf="print.id === currentCardId">
            <mat-icon>check_circle</mat-icon>
          </div>
        </div>
      </div>

      <div *ngIf="!isLoading && prints.length === 0" class="empty-state">
        <p>Nenhuma outra versão encontrada.</p>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .version-content {
      min-height: 300px;
      padding-bottom: 20px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #8f98a0;
      gap: 16px;
    }

    .prints-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 16px;
      margin-top: 10px;
    }

    .print-item {
      position: relative;
      cursor: pointer;
      border-radius: 8px;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
      background: #101822;
      border: 2px solid transparent;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.5);
        border-color: #66c0f4;
      }

      &.selected {
        border-color: #66c0f4;
        box-shadow: 0 0 10px rgba(102, 192, 244, 0.3);
      }

      img {
        width: 100%;
        display: block;
        aspect-ratio: 2.5/3.5;
        object-fit: cover;
      }

      .print-info {
        padding: 8px;
        background: rgba(0,0,0,0.8);
        position: absolute;
        bottom: 0;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 4px;

        .set-name {
          font-size: 0.75rem;
          color: #c7d5e0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .price {
          font-size: 0.85rem;
          color: #66c0f4;
          font-weight: bold;
        }
      }

      .selected-overlay {
        position: absolute;
        top: 8px;
        right: 8px;
        color: #66c0f4;
        background: rgba(0,0,0,0.6);
        border-radius: 50%;
        display: flex;
      }
    }
  `]
})
export class WatchlistVersionDialogComponent implements OnInit {
  isLoading = true;
  prints: any[] = [];
  currentCardId: string;
  cardName: string;

  constructor(
    public dialogRef: MatDialogRef<WatchlistVersionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cardId: string, cardName: string },
    private cardService: CardService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentCardId = data.cardId;
    this.cardName = data.cardName;
    console.log('Opening Version Dialog for:', this.cardName, 'ID:', this.currentCardId);
  }

  ngOnInit() {
    this.loadPrints();
  }

  loadPrints() {
    this.isLoading = true;
    this.cardService.getCardPrints(this.cardName).subscribe({
      next: (res: any) => {
        console.log('Prints Response:', res);
        setTimeout(() => {
          if (res && res.data) {
            this.prints = res.data;
          } else {
            console.warn('No data found in prints response');
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Error loading prints', err);
        setTimeout(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  getImageUrl(print: any): string {
    if (print.image_uris?.normal) return print.image_uris.normal;
    if (print.card_faces?.[0]?.image_uris?.normal) return print.card_faces[0].image_uris.normal;
    return '';
  }

  selectVersion(print: any) {
    if (print.id !== this.currentCardId) {
      this.dialogRef.close(print.id);
    } else {
      // If clicking selected, maybe just close? Or do nothing? Let's just close.
      this.dialogRef.close();
    }
  }
}
