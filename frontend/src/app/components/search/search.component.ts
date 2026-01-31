import { Component, Input, ChangeDetectorRef, NgZone, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { CardService } from '../../services/card.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, MatInputModule, MatButtonModule, MatIconModule, MatCardModule, RouterModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent {

  @Input() isCompact: boolean = false;

  searchTerm: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  suggestions: any[] = [];
  private searchSubject = new Subject<string>();

  constructor(
    private cardService: CardService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private elementRef: ElementRef
  ) {
    // Setup Debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 2) return [];
        return this.cardService.getAutocomplete(query).pipe(
          catchError(() => [])
        );
      })
    ).subscribe((response: any) => {
      if (response && response.data) {
        this.suggestions = response.data; // Agora é array de objetos {name, imageUrl, id}
      } else {
        this.suggestions = [];
      }
      this.cdr.detectChanges();
    });
  }

  onSearchInput() {
    this.searchSubject.next(this.searchTerm);
  }

  selectSuggestion(suggestion: any) {
    this.searchTerm = suggestion.name;
    this.suggestions = [];

    // Navega direto pelo ID se disponível, senão busca pelo nome
    if (suggestion.id) {
      this.router.navigate(['/card', suggestion.id]);
    } else {
      this.buscar();
    }
  }

  highlightMatch(text: string): string {
    if (!this.searchTerm) return text;
    const regex = new RegExp(`(${this.searchTerm})`, 'gi');
    return text.replace(regex, '<span class="match">$1</span>');
  }

  buscar() {
    if (!this.searchTerm.trim()) return;

    // Fecha teclado
    (document.activeElement as HTMLElement).blur();

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();


    this.cardService.searchCard(this.searchTerm).subscribe({
      next: (card) => {

        if (card && card.id) {
          console.log('Carta encontrada. Forçando recarregamento para:', card.id);

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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.suggestions = [];
    }
  }
}