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


  getCardById(id: string): Observable<Card> {
    return this.http.get<Card>(`${this.apiUrl}/${id}`);
  }


  getCardHistory(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/history`);
  }


  getCardPrints(cardName: string): Observable<any> {

    return this.http.get<any>(`https://api.scryfall.com/cards/search?q=!"${cardName}"&unique=prints`);
  }

  getMarketOverview(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/market`);
  }
}