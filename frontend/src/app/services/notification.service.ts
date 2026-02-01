import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer, switchMap, retry, shareReplay, tap, map } from 'rxjs';
import { Notification } from '../models/notification.model';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = 'http://localhost:8080/api/notifications';

    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();

    public unreadCount$ = this.notifications$.pipe(
        map(list => list.filter(n => !n.isRead).length)
    );

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private ngZone: NgZone // Inject NgZone
    ) {
        this.startPolling();
    }

    private startPolling() {
        // Poll every 30 seconds (reduced from 60s)
        timer(0, 30000).pipe(
            switchMap(() => {
                if (this.authService.getCurrentUserValue()) {
                    return this.http.get<Notification[]>(this.apiUrl).pipe(
                        retry(2)
                    );
                }
                return [];
            })
        ).subscribe({
            next: (data) => {
                // Force run in Angular Zone to ensure UI updates without implicit clicks
                this.ngZone.run(() => {
                    this.notificationsSubject.next(data);
                });
            },
            error: (err) => console.error('Erro ao buscar notificações', err)
        });
    }

    refresh() {
        if (!this.authService.getCurrentUserValue()) return;
        this.http.get<Notification[]>(this.apiUrl).subscribe(data => {
            this.ngZone.run(() => {
                this.notificationsSubject.next(data);
            });
        });
    }

    markAsRead(id: string) {
        return this.http.put(`${this.apiUrl}/${id}/read`, {}).pipe(
            tap(() => {
                // Optimistic update
                this.ngZone.run(() => {
                    const current = this.notificationsSubject.value;
                    const updated = current.map(n => n.id === id ? { ...n, isRead: true } : n);
                    this.notificationsSubject.next(updated);
                });
            })
        );
    }

    markAllAsRead() {
        return this.http.put(`${this.apiUrl}/read-all`, {}).pipe(
            tap(() => {
                this.ngZone.run(() => {
                    const current = this.notificationsSubject.value;
                    const updated = current.map(n => ({ ...n, isRead: true }));
                    this.notificationsSubject.next(updated);
                });
            })
        );
    }

    delete(id: string) {
        return this.http.delete(`${this.apiUrl}/${id}`).pipe(
            tap(() => {
                this.ngZone.run(() => {
                    const current = this.notificationsSubject.value;
                    const updated = current.filter(n => n.id !== id);
                    this.notificationsSubject.next(updated);
                });
            })
        );
    }
}
