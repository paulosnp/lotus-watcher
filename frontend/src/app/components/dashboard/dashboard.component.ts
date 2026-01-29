import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // <--- 1. Importar ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SearchComponent } from '../search/search.component';
import { CardService } from '../../services/card.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, SearchComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  topRisers: any[] = [];
  topFallers: any[] = [];
  isLoading: boolean = true;
  
  cardBackUrl = 'https://upload.wikimedia.org/wikipedia/en/a/a4/Magic_the_gathering-card_back.jpg';

  constructor(
    private router: Router,
    private cardService: CardService,
    private cdr: ChangeDetectorRef // <--- 2. Injetar o Despertador
  ) {}

  ngOnInit(): void {
    this.carregarDadosMercado();
  }

  carregarDadosMercado() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.cardService.getMarketOverview().subscribe({
      next: (data) => {
        console.log('Dados Reais:', data);

        // AGORA É DIRETO: Não precisamos mais do .map() para inventar numeros
        // O Java já mandou o campo "priceChangePercentage" preenchido!
        
        if (data && data.risers) {
          this.topRisers = data.risers;
        } else {
          this.topRisers = [];
        }

        if (data && data.fallers) {
          this.topFallers = data.fallers;
        } else {
          this.topFallers = [];
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar mercado:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  irParaDetalhes(id: string) {
    if (id) {
      window.location.assign('/card/' + id);
    }
  }
}