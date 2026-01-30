import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { MatIconModule } from '@angular/material/icon';

import { Chart, registerables, ChartConfiguration, ChartOptions } from 'chart.js';

import { CardService } from '../../services/card.service';
import { Card } from '../../models/card.model';

@Component({
  selector: 'app-card-details',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, MatIconModule], // BaseChartDirective é o que desenha o gráfico
  templateUrl: './card-details.component.html',
  styleUrls: ['./card-details.component.scss']
})
export class CardDetailsComponent implements OnInit {

  card: Card | null = null;
  prints: any[] = [];
  isLoading: boolean = true;

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
    scales: {
      x: { ticks: { color: '#8b9bb4' }, grid: { color: '#2a3545' } },
      y: { ticks: { color: '#4caf50' }, grid: { color: '#2a3545' } }
    },
    plugins: { legend: { labels: { color: 'white' } } }
  };

  constructor(
    private route: ActivatedRoute,
    private cardService: CardService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
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
        this.cdr.detectChanges();

        // Carrega Prints com um pequeno delay para garantir renderização
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
              this.lineChartData.labels = hist.map(h => new Date(h.timestamp).toLocaleDateString());
              this.lineChartData.datasets[0].data = hist.map(h => h.priceUsd);

              // Força atualização do gráfico
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

  voltar() {
    this.router.navigate(['/']);
  }

  getLigaMagicLink(): string {
    if (!this.card) return '#';

    // Codifica o nome (troca espaços por %20) para a URL não quebrar
    const nomeCodificado = encodeURIComponent(this.card.name);

    return `https://www.ligamagic.com.br/?view=cards/search&card=${nomeCodificado}`;
  }
}