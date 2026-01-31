import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AdminService {

    private apiUrl = 'http://localhost:8080/api/admin';

    constructor(private http: HttpClient) { }

    getStats(): Observable<any> {
        return this.http.get(`${this.apiUrl}/stats`);
    }

    triggerSync(): Observable<any> {
        return this.http.post(`${this.apiUrl}/scryfall/sync`, {});
    }

    getSyncStatus(): Observable<any> {
        return this.http.get(`${this.apiUrl}/scryfall/status`);
    }

    getUsers(page: number = 0, size: number = 10): Observable<any> {
        return this.http.get(`${this.apiUrl}/users?page=${page}&size=${size}`);
    }

    // --- CARDS ---
    getAllCards(page: number, size: number = 20): Observable<any> {
        return this.http.get(`${this.apiUrl}/cards?page=${page}&size=${size}&sortBy=name`);
    }

    toggleUserStatus(userId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/users/${userId}/toggle-status`, {});
    }

    toggleUserRole(userId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/users/${userId}/toggle-role`, {});
    }
}
