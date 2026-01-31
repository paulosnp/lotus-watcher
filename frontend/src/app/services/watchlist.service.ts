import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

export interface WatchlistItemDto {
    cardId: string;
    targetPrice?: number;
    notes?: string;
    tag?: string;
}

@Injectable({
    providedIn: 'root'
})
export class WatchlistService {

    private apiUrl = 'http://localhost:8080/api/watchlist';

    // Helper to check if a card is in the list (loaded separately)
    // The Set stores card.id
    private watchedIds: Set<string> = new Set();

    private _watchlist: any[] = [];

    // BehaviorSubject for reactive UI
    private watchlistSubject = new BehaviorSubject<any[]>([]);
    watchlist$ = this.watchlistSubject.asObservable();

    constructor(private http: HttpClient, private authService: AuthService) { }

    getWatchlist(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }

    addToWatchlist(item: WatchlistItemDto): Observable<any> {
        return this.http.post<any>(this.apiUrl, item);
    }

    removeFromWatchlist(itemId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${itemId}`);
    }

    loadWatchlist() {
        this.getWatchlist().subscribe(list => {
            this._watchlist = list;
            this.watchedIds = new Set(list.map(i => i.card.id));
            this.notify();
        });
    }

    isWatched(cardId: string): boolean {
        return this.watchedIds.has(cardId);
    }

    notify() {
        this.watchlistSubject.next(this._watchlist);
    }
}
