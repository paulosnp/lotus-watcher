import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { MatDivider, MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HttpClient } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatInputModule, MatIconModule, MatSnackBarModule, MatDividerModule, MatFormFieldModule, MatProgressSpinnerModule, TranslatePipe, MatTooltipModule],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

    user: any = null;

    // Avatars (Redirect Links estáveis)
    avatars = [
        'https://api.scryfall.com/cards/m11/58?format=image&version=art_crop',   // Jace Beleren
        'https://api.scryfall.com/cards/m11/128?format=image&version=art_crop',  // Chandra Nalaar
        'https://api.scryfall.com/cards/m11/102?format=image&version=art_crop',  // Liliana Vess
        'https://api.scryfall.com/cards/m11/172?format=image&version=art_crop',  // Garruk Wildspeaker
        'https://api.scryfall.com/cards/m11/1?format=image&version=art_crop',    // Ajani Goldmane
        'https://api.scryfall.com/cards/war/61?format=image&version=art_crop'    // Kasmina (Random Cool One)
    ];

    selectedAvatar: string = '';

    newName: string = '';
    oldPassword = ''; // Nova propriedade
    password = '';
    confirmPassword = '';
    isLoading = false;
    isUploading = false;

    // UI States
    isEditingName = false;
    isChangingPassword = false;

    constructor(
        private authService: AuthService,
        private snackBar: MatSnackBar,
        private router: Router,
        private http: HttpClient,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.authService.currentUser$.subscribe(u => {
            // Defer update to avoid NG0100 (ExpressionChangedAfterItHasBeenCheckedError)
            setTimeout(() => {
                this.user = u;
                if (u) {
                    if (u.avatar) {
                        this.selectedAvatar = u.avatar;
                    }
                    this.newName = u.name;
                }
                this.cdr.detectChanges();
            }, 0);
        });
    }

    selectAvatar(url: string) {
        this.selectedAvatar = url;
    }

    // --- UPLOAD ---
    triggerFileInput() {
        const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
        if (fileInput) fileInput.click();
    }

    onFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (file) {
            this.isUploading = true;
            const formData = new FormData();
            formData.append('file', file);

            this.http.post<any>('http://localhost:8080/api/upload', formData).subscribe({
                next: (res: any) => {
                    setTimeout(() => {
                        this.selectedAvatar = res.url;
                        this.isUploading = false;
                        this.cdr.detectChanges();
                    }, 0);
                    this.snackBar.open('Imagem carregada com sucesso!', 'OK', { duration: 3000 });
                },
                error: (err: any) => {
                    console.error(err);
                    setTimeout(() => {
                        this.isUploading = false;
                        this.cdr.detectChanges();
                    }, 0);
                    this.snackBar.open('Erro ao enviar imagem.', 'Fechar', { duration: 3000 });
                }
            });
        }
    }

    // --- TOGGLES ---
    toggleEditName() {
        this.isEditingName = !this.isEditingName;
        if (!this.isEditingName) {
            this.newName = this.user.name; // Cancelar
        }
    }

    toggleChangePassword() {
        this.isChangingPassword = !this.isChangingPassword;
        this.oldPassword = '';
        this.password = '';
        this.confirmPassword = '';
    }

    // --- ACTIONS ---

    // 1. Salvar Nome
    saveName() {
        if (!this.newName || this.newName.trim().length === 0) {
            this.snackBar.open('O nome não pode ser vazio.', 'Fechar', { duration: 3000 });
            return;
        }

        this.isLoading = true;
        this.authService.updateProfile({ name: this.newName }).subscribe({
            next: () => {
                this.snackBar.open('Nome atualizado!', 'OK', { duration: 3000 });
                this.isEditingName = false;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error(err);
                this.snackBar.open('Erro ao atualizar nome.', 'Fechar', { duration: 3000 });
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    // 2. Salvar Senha
    savePassword() {
        if (!this.oldPassword) {
            this.snackBar.open('Digite sua senha atual!', 'Fechar', { duration: 3000 });
            return;
        }
        if (this.password !== this.confirmPassword) {
            this.snackBar.open('As senhas novas não conferem!', 'Fechar', { duration: 3000 });
            return;
        }

        this.isLoading = true;
        const passDto = {
            oldPassword: this.oldPassword,
            newPassword: this.password
        };

        this.authService.changePassword(passDto).subscribe({
            next: () => {
                // 1. Close Form & Update UI FIRST
                this.isChangingPassword = false;
                this.oldPassword = '';
                this.password = '';
                this.confirmPassword = '';
                this.isLoading = false;
                this.cdr.detectChanges(); // Force view update immediately

                // 2. Show Success Message
                this.snackBar.open('Senha alterada com sucesso!', 'OK', { duration: 3000 });
            },
            error: (err) => {
                console.error(err);
                const msg = err.error?.error || 'Erro ao alterar senha.';
                this.isLoading = false;
                this.cdr.detectChanges();
                this.snackBar.open(msg, 'Fechar', { duration: 3000 });
            }
        });
    }

    // 3. Salvar Avatar
    saveAvatar() {
        if (this.selectedAvatar === this.user?.avatar) {
            this.snackBar.open('Escolha um avatar diferente.', 'Fechar', { duration: 2000 });
            return;
        }

        this.isLoading = true;
        this.authService.updateProfile({ avatar: this.selectedAvatar }).subscribe({
            next: () => {
                this.snackBar.open('Avatar atualizado!', 'OK', { duration: 3000 });
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error(err);
                this.snackBar.open('Erro ao atualizar avatar.', 'Fechar', { duration: 3000 });
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    private checkCompletion(pending: number) {
        if (pending <= 0) {
            setTimeout(() => {
                this.isLoading = false;
                this.cdr.detectChanges();
            }, 0);
        }
    }
}
