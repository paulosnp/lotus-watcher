import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-sudo-login',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule],
    templateUrl: './sudo-login.html',
    styleUrls: ['./sudo-login.scss']
})
export class SudoLoginComponent {
    password = '';
    loading = false;
    error = '';

    constructor(private authService: AuthService, private router: Router) { }

    onSubmit() {
        if (!this.password) return;

        this.loading = true;
        this.error = '';

        this.authService.verifyPassword(this.password).subscribe({
            next: () => {
                this.loading = false;
                this.router.navigate(['/admin']);
            },
            error: (err: any) => {
                this.loading = false;
                this.error = 'Senha incorreta.';
                console.error(err);
            }
        });
    }
}
