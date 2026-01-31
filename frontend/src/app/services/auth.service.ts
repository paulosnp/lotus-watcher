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

    constructor(private http: HttpClient, private router: Router) {
        this.checkToken();
    }

    // Verifica se já tem token salvo ao recarregar a página
    private checkToken() {
        const token = localStorage.getItem('token');
        if (token) {
            // Aqui poderíamos decodificar o token para pegar o nome do usuário
            // Por enquanto, vamos assumir que se tem token, está logado
            this.currentUserSubject.next({ token });
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

    updateProfile(data: { name: string }): Observable<any> {
        return this.http.put(`${this.userApiUrl}/update`, data);
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
