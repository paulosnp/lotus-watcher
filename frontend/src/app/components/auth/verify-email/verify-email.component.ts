import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-verify-email',
    standalone: true,
    imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
    templateUrl: './verify-email.component.html',
    styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent {
    code = '';
    isLoading = false;
    success = false;
    message = '';

    constructor(
        private http: HttpClient,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    onSubmit() {
        if (this.code.length < 6) return;

        this.isLoading = true;
        this.message = ''; // Limpa mensagens anteriores

        this.http.get(`http://localhost:8080/api/auth/verify?token=${this.code}`).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                this.success = true;
                this.message = 'Código verificado com sucesso!';
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isLoading = false;
                this.success = false;
                this.message = err.error?.error || 'Código inválido ou expirado.';
                this.cdr.detectChanges();
            }
        });
    }
}
