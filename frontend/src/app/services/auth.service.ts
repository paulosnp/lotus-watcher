import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private apiUrl = 'http://localhost:8080/api/auth';
    private userApiUrl = 'http://localhost:8080/api/user';
    private currentUserSubject = new BehaviorSubject<any>(null);
    public currentUser$ = this.currentUserSubject.asObservable(); // Observable público

    getCurrentUserValue(): any {
        return this.currentUserSubject.value;
    }

    constructor(private http: HttpClient, private router: Router) {
        this.checkToken();
    }

    // Verifica se já tem token salvo ao recarregar a página
    private checkToken() {
        const token = localStorage.getItem('token');
        if (token) {
            this.currentUserSubject.next({ token }); // Restore basic state
            this.getMe().subscribe({
                next: (user) => {
                    // Merge with token info just in case, but usually backend returns full user
                    this.currentUserSubject.next({ ...user, token });
                },
                error: () => this.logout() // If token invalid, logout
            });
        }
    }

    isLoggedIn(): boolean {
        return !!localStorage.getItem('token');
    }

    register(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, data);
    }

    login(credentials: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
            tap((response: any) => {
                if (response.accessToken) {
                    localStorage.setItem('token', response.accessToken);
                    this.currentUserSubject.next({ token: response.accessToken });

                    // Fetch full profile immediately
                    this.getMe().subscribe(user => {
                        this.currentUserSubject.next({ ...user, token: response.accessToken });
                    });
                }
            })
        );
    }

    logout() {
        localStorage.removeItem('token');
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    // --- UTILS ROLE ---
    isAdmin(): boolean {
        const token = this.getToken();
        if (!token) return false;
        try {
            const payload = token.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            return decoded.role === 'ADMIN';
        } catch (e) {
            return false;
        }
    }

    // --- NOVOS MÉTODOS DE PERFIL ---

    getMe(): Observable<any> {
        return this.http.get(`${this.userApiUrl}/me`);
    }

    updateProfile(data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/profile`, data).pipe(
            tap((updatedUser: any) => {
                // Atualiza o estado local do usuário sem precisar relogar
                const currentUser = this.currentUserSubject.value;
                if (currentUser) {
                    this.currentUserSubject.next({ ...currentUser, ...updatedUser });
                }
            })
        );
    }

    changePassword(data: any): Observable<any> {
        return this.http.put(`${this.userApiUrl}/change-password`, data);
    }

    // --- SUDO MODE ---

    isSudoAuthenticated(): boolean {
        return sessionStorage.getItem('sudo_mode') === 'true';
    }

    verifyPassword(password: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/verify-password`, { password }).pipe(
            tap(() => {
                sessionStorage.setItem('sudo_mode', 'true');
            })
        );
    }
}
