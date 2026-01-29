import { Component, Input, ChangeDetectorRef, NgZone } from '@angular/core'; // <--- Adicione Input
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { CardService } from '../../services/card.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, MatInputModule, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent {

  @Input() isCompact: boolean = false;

  searchTerm: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private cardService: CardService, 
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone // <--- 2. Injete o NgZone
  ) {}

  buscar() {
    if (!this.searchTerm.trim()) return;

    // Fecha teclado
    (document.activeElement as HTMLElement).blur();

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    // Usando subscribe clássico para garantir compatibilidade
    this.cardService.searchCard(this.searchTerm).subscribe({
      next: (card) => {
        
        if (card && card.id) {
            console.log('Carta encontrada. Forçando recarregamento para:', card.id);
            
            // --- AQUI ESTÁ A MUDANÇA ---
            // Isso obriga o navegador a carregar a nova página do zero.
            // É impossível o Angular "travar" aqui, pois o navegador assume o controle.
            window.location.assign('/card/' + card.id);
            
        } else {
            this.isLoading = false;
            this.errorMessage = 'Carta não encontrada.';
            this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.errorMessage = 'Erro ao buscar carta.';
        this.cdr.detectChanges();
      }
    });
  }
}