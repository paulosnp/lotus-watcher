import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// Se você tiver um arquivo de modelo, mantenha o import. Se não, pode usar 'any'.
import { Card } from '../models/card.model'; 

@Injectable({
  providedIn: 'root'
})
export class CardService {

  // O "apiUrl" já termina com "/cards", por isso deu o erro duplicado antes
  private apiUrl = 'http://localhost:8080/api/cards';

  constructor(private http: HttpClient) { }

  // 1. Busca carta pelo nome (Usado na Barra de Pesquisa)
  searchCard(name: string): Observable<Card> {
    return this.http.get<Card>(`${this.apiUrl}/search?name=${name}`);
  }

  // 2. Busca detalhes pelo ID (Usado na Página da Carta)
  getCardById(id: string): Observable<Card> {
    return this.http.get<Card>(`${this.apiUrl}/${id}`);
  }

  // 3. Busca histórico de preços (Usado no Gráfico)
  getCardHistory(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/history`);
  }

  // 4. Busca outras versões/prints (API Externa do Scryfall)
  getCardPrints(cardName: string): Observable<any> {
    // A sintaxe q=!"nome" força a busca exata no Scryfall
    return this.http.get<any>(`https://api.scryfall.com/cards/search?q=!"${cardName}"&unique=prints`);
  }

  // 5. Busca dados do Mercado (CORRIGIDO)
  getMarketOverview(): Observable<any> {
    // ANTES (ERRADO): return this.http.get<any>(`${this.apiUrl}/cards/market`);
    
    // AGORA (CORRETO):
    return this.http.get<any>(`${this.apiUrl}/market`);
  }
}