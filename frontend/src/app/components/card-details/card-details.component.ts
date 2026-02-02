import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // Import Location
import { ActivatedRoute, Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { MatIconModule } from '@angular/material/icon';
import { Chart, registerables, ChartConfiguration, ChartOptions } from 'chart.js';

import { CardService } from '../../services/card.service';
import { Card } from '../../models/card.model';
import { WatchlistService } from '../../services/watchlist.service';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { WatchlistDialogComponent } from '../watchlist/watchlist-dialog.component';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-card-details',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, MatIconModule, TranslatePipe],
  templateUrl: './card-details.component.html',
  styleUrls: ['./card-details.component.scss']
})
export class CardDetailsComponent implements OnInit {

  // ... (previous properties)
  card: Card | null = null;
  watchlistItemId: string | null = null; // Store the Item ID for removal
  prints: any[] = [];
  isLoading: boolean = true;
  isFavorite: boolean = false;

  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Preço (USD)',
        fill: true,
        tension: 0.4,
        borderColor: '#66c0f4',
        backgroundColor: 'rgba(102, 192, 244, 0.2)'
      }
    ]
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: { tension: 0.4, borderWidth: 3 },
      point: { radius: 4, hoverRadius: 6, backgroundColor: '#66c0f4' }
    },
    scales: {
      x: {
        ticks: { color: '#8b9bb4', font: { size: 10 } },
        grid: { color: 'rgba(42, 53, 69, 0.5)', display: true }
      },
      y: {
        ticks: {
          color: '#4caf50',
          callback: (value) => {
            if (typeof value === 'number') {
              return '$' + value.toFixed(2);
            }
            return value;
          }
        },
        grid: { color: 'rgba(42, 53, 69, 0.5)' }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(27, 40, 56, 0.9)',
        titleColor: '#fff',
        bodyColor: '#66c0f4',
        borderColor: '#66c0f4',
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const val = context.parsed?.y;
            return val !== null && val !== undefined ? ' $' + val.toFixed(2) : '';
          }
        }
      }
    }
  };

  isLoggedIn: boolean = false;

  // ... imports


  constructor(
    private route: ActivatedRoute,
    private cardService: CardService,
    private watchlistService: WatchlistService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private location: Location,
    private dialog: MatDialog // Inject MatDialog
  ) {
    Chart.register(...registerables);
  }

  toggleFavorite() {
    if (!this.card) return;

    if (this.isFavorite) {
      if (!this.watchlistItemId) {
        console.error("Erro: ID do item da watchlist não encontrado");
        return;
      }

      if (confirm('Remover da Watchlist?')) {
        this.watchlistService.removeFromWatchlist(this.watchlistItemId).subscribe(() => {
          this.isFavorite = false;
          this.watchlistItemId = null;
          this.cdr.detectChanges();
        });
      }
    } else {
      // Open Dialog
      const dialogRef = this.dialog.open(WatchlistDialogComponent, {
        width: '450px',
        panelClass: 'lotus-dialog-container',
        data: { card: this.card }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.isFavorite = true;
          this.cdr.detectChanges();
        }
      });
    }
  }

  ngOnInit(): void {
    // Monitora status de login e carrega watchlist
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      if (this.isLoggedIn) {
        this.watchlistService.loadWatchlist();
      }
      this.cdr.detectChanges();
    });

    // Monitora lista para atualizar status do botão
    this.watchlistService.watchlist$.subscribe(list => {
      if (this.card) {
        const item = list.find(c => c.card.id === this.card?.id);
        this.isFavorite = !!item;
        this.watchlistItemId = item ? item.id : null;
        this.cdr.detectChanges();
      }
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isLoading = true;
        this.card = null;
        this.prints = [];
        this.cdr.detectChanges();
        this.carregarCarta(id);
      }
    });
  }

  carregarCarta(id: string) {
    this.cardService.getCardById(id).subscribe({
      next: (c) => {
        this.card = c;
        this.isFavorite = this.watchlistService.isWatched(c.id);
        this.cdr.detectChanges();

        // Carrega Prints
        this.cardService.getCardPrints(c.name).subscribe(resp => {
          setTimeout(() => {
            this.prints = resp.data || [];
            this.cdr.detectChanges();
          }, 100);
        });

        // Carrega Histórico
        this.cardService.getCardHistory(id).subscribe(hist => {
          setTimeout(() => {
            if (hist && hist.length > 0) {

              // LÓGICA: Se tiver apenas 1 ponto (preço constante/novo), duplica para criar uma linha reta
              if (hist.length === 1) {
                const p = hist[0];
                this.lineChartData.labels = ['Começo', 'Atual'];
                this.lineChartData.datasets[0].data = [p.priceUsd, p.priceUsd];
              } else {
                this.lineChartData.labels = hist.map(h => new Date(h.timestamp).toLocaleDateString());
                this.lineChartData.datasets[0].data = hist.map(h => h.priceUsd);
              }

              // Estilo do Dataset
              this.lineChartData.datasets[0].borderColor = '#4caf50'; // Verde Money
              this.lineChartData.datasets[0].backgroundColor = 'rgba(76, 175, 80, 0.1)'; // Verde suave
              this.lineChartData.datasets[0].pointBackgroundColor = '#4caf50';
              this.lineChartData.datasets[0].label = 'Valor de Mercado';

              this.lineChartData = { ...this.lineChartData };
            }

            this.isLoading = false;
            this.cdr.detectChanges();
          }, 50);
        });
      },
      error: (err) => {
        console.error('Erro ao carregar detalhes', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getLastUpdateText(): string {
    if (!this.card || !this.card.lastUpdate) return 'Desconhecido';
    return new Date(this.card.lastUpdate).toLocaleString();
  }

  voltar() {
    this.location.back();
  }

  selecionarEdicao(id: string) {
    if (this.card && this.card.id === id) return; // Evita recarregar a mesma carta

    // Navega para a mesma rota mas com ID diferente
    // O ngOnInit detecta a mudança e recarrega tudo
    this.router.navigate(['/card', id]);
  }

  getLigaMagicLink(): string {
    if (!this.card) return '#';

    // Codifica o nome (troca espaços por %20) para a URL não quebrar
    const nomeCodificado = encodeURIComponent(this.card.name);

    return `https://www.ligamagic.com.br/?view=cards/search&card=${nomeCodificado}`;
  }
}