import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Card } from '../models/card.model';

@Injectable({
    providedIn: 'root'
})
export class WatchlistService {

    private apiUrl = 'http://localhost:8080/api/user/watchlist';

    // Cache local para atualização instantânea na UI
    private watchlistSubject = new BehaviorSubject<Card[]>([]);
    watchlist$ = this.watchlistSubject.asObservable();

    constructor(private http: HttpClient) { }

    loadWatchlist() {
        this.http.get<Card[]>(this.apiUrl).subscribe({
            next: (list) => this.watchlistSubject.next(list),
            error: (err) => console.error('Erro ao carregar watchlist', err)
        });
    }

    addToWatchlist(card: Card): Observable<any> {
        return this.http.post(`${this.apiUrl}/${card.id}`, {}).pipe(
            tap(() => {
                const current = this.watchlistSubject.value;
                if (!current.find(c => c.id === card.id)) {
                    this.watchlistSubject.next([...current, card]);
                }
            })
        );
    }

    removeFromWatchlist(cardId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${cardId}`).pipe(
            tap(() => {
                const current = this.watchlistSubject.value;
                this.watchlistSubject.next(current.filter(c => c.id !== cardId));
            })
        );
    }

    isWatched(cardId: string): boolean {
        return !!this.watchlistSubject.value.find(c => c.id === cardId);
    }
}
