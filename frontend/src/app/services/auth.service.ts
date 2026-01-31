import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private apiUrl = 'http://localhost:8080/api/auth';
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
}
