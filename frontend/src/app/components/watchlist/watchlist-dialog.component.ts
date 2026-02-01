import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TextFieldModule } from '@angular/cdk/text-field';
import { WatchlistService } from '../../services/watchlist.service';

@Component({
  selector: 'app-watchlist-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, MatIconModule, TextFieldModule],
  templateUrl: './watchlist-dialog.component.html',
  styleUrls: ['./watchlist-dialog.component.scss']
})
export class WatchlistDialogComponent {
  targetPrice: number | null = null;
  notes: string = '';
  tag: string = '';
  isLoading = false;

  constructor(
    public dialogRef: MatDialogRef<WatchlistDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private watchlistService: WatchlistService
  ) {
    if (data.item) {
      this.targetPrice = data.item.targetPrice;
      this.notes = data.item.notes;
      this.tag = data.item.tag;
    }
  }

  save() {
    this.isLoading = true;
    const dto = {
      cardId: this.data.item ? this.data.item.card.id : this.data.card.id,
      targetPrice: this.targetPrice || undefined,
      notes: this.notes,
      tag: this.tag
    };

    if (this.data.item) {
      this.watchlistService.updateItem(this.data.item.id, dto).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          console.error(err);
          this.isLoading = false;
        }
      });
    } else {
      this.watchlistService.addToWatchlist(dto).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          console.error(err);
          this.isLoading = false;
        }
      });
    }
  }
}
