import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Card } from '../models/card.model';

@Injectable({
  providedIn: 'root'
})
export class CardService {

  private apiUrl = 'http://localhost:8080/api/cards';

  constructor(private http: HttpClient) { }


  searchCard(name: string): Observable<Card> {
    return this.http.get<Card>(`${this.apiUrl}/search?name=${name}`);
  }

  // Busca lista de cartas (ex: 'set:dmu' ou 'black lotus')
  searchCards(query: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/search-results?q=${query}`);
  }

  getAutocomplete(query: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/autocomplete?q=${query}`);
  }


  getCardById(id: string): Observable<Card> {
    return this.http.get<Card>(`${this.apiUrl}/${id}`);
  }


  getCardHistory(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/history`);
  }


  getCardPrints(cardName: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/prints/${cardName}`);
  }

  getMarketOverview(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/market`);
  }

  getRandomCard(): Observable<Card> {
    return this.http.get<Card>(`${this.apiUrl}/random`);
  }
}