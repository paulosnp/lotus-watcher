import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
    templateUrl: './register.component.html',
    styleUrls: ['../login/login.component.scss'] // Reutilizando estilo do Login!
})
export class RegisterComponent {
    name = '';
    email = '';
    password = '';
    errorMessage = '';

    successMessage = '';

    constructor(private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) { }

    onSubmit() {
        this.authService.register({
            name: this.name,
            email: this.email,
            password: this.password
        }).subscribe({
            next: () => {
                console.log('Register Success! Message set.'); // Debug Log
                this.successMessage = 'Conta criada com sucesso! Verifique seu email para pegar o código.';
                this.cdr.detectChanges(); // Força atualização da UI
                setTimeout(() => {
                    this.router.navigate(['/verify']); // Redirect to verify
                }, 1500);
            },
            error: (err) => {
                console.error('Registration Failed', err);
                // O backend agora retorna JSON { "error": "mensagem" }
                if (err.error && err.error.error) {
                    this.errorMessage = err.error.error;
                } else if (err.error && typeof err.error === 'string') {
                    // Fallback caso retorne string
                    this.errorMessage = err.error;
                } else {
                    this.errorMessage = 'Erro ao criar conta. Tente novamente.';
                }
                this.cdr.detectChanges(); // Força atualização da UI
            }
        });
    }
}
