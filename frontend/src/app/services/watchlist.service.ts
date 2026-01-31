import { Injectable } from '@angular/core';
import { Card } from '../models/card.model';

@Injectable({
    providedIn: 'root'
})
export class WatchlistService {

    private storageKey = 'lotus_watchlist';

    constructor() { }

    getWatchlist(): Card[] {
        const list = localStorage.getItem(this.storageKey);
        return list ? JSON.parse(list) : [];
    }

    addToWatchlist(card: Card) {
        const list = this.getWatchlist();
        if (!list.find(c => c.id === card.id)) {
            list.push(card);
            localStorage.setItem(this.storageKey, JSON.stringify(list));
        }
    }

    removeFromWatchlist(cardId: string) {
        let list = this.getWatchlist();
        list = list.filter(c => c.id !== cardId);
        localStorage.setItem(this.storageKey, JSON.stringify(list));
    }

    isWatched(cardId: string): boolean {
        const list = this.getWatchlist();
        return !!list.find(c => c.id === cardId);
    }
}
