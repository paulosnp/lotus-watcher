import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // Import Location
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-account-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule],
    templateUrl: './account-settings.component.html',
    styleUrls: ['./account-settings.component.scss']
})
export class AccountSettingsComponent implements OnInit {

    user: any = null;
    isLoading: boolean = true;

    // Edit Profile
    isEditingProfile: boolean = false;
    newName: string = '';

    // Change Password
    isChangingPassword: boolean = false;
    passwordData = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    };

    message: string = '';
    error: string = '';

    constructor(
        private authService: AuthService,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private location: Location // Inject Location
    ) { }

    ngOnInit(): void {
        if (!this.authService.isLoggedIn()) {
            this.router.navigate(['/login']);
            return;
        }
        this.loadUserData();
    }

    goBack() {
        this.location.back();
    }

    loadUserData() {
        this.isLoading = true;
        this.authService.getMe().subscribe({
            next: (data: any) => {
                this.user = data;
                this.newName = data.name;
                this.isLoading = false;
                this.cdr.detectChanges(); // Força atualização da view
            },
            error: (err: any) => {
                console.error('Erro ao carregar perfil', err);
                // Se der erro 403, pode ser token expirado
                this.authService.logout();
            }
        });
    }

    toggleEditProfile() {
        this.isEditingProfile = !this.isEditingProfile;
        if (!this.isEditingProfile) {
            this.newName = this.user.name; // Reset se cancelar
        }
    }

    saveProfile() {
        if (!this.newName.trim()) return;

        this.authService.updateProfile({ name: this.newName }).subscribe({
            next: (res: any) => {
                this.user.name = this.newName;
                this.isEditingProfile = false;
                this.showMessage('✅ Perfil atualizado com sucesso!');
            },
            error: (err: any) => {
                this.showError('❌ Erro ao atualizar perfil.');
            }
        });
    }

    toggleChangePassword() {
        this.isChangingPassword = !this.isChangingPassword;
        this.passwordData = { oldPassword: '', newPassword: '', confirmPassword: '' }; // Limpa campos
    }

    updatePassword() {
        if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
            this.showError('❌ As novas senhas não coincidem.');
            return;
        }

        if (this.passwordData.newPassword.length < 6) {
            this.showError('❌ A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        this.authService.changePassword({
            oldPassword: this.passwordData.oldPassword,
            newPassword: this.passwordData.newPassword
        }).subscribe({
            next: (res: any) => {
                this.toggleChangePassword();
                this.showMessage('✅ Senha alterada com sucesso!');
            },
            error: (err: any) => {
                // Pega mensagem de erro do backend se houver
                const msg = err.error?.error || 'Erro ao alterar senha.';
                this.showError('❌ ' + msg);
            }
        });
    }

    showMessage(msg: string) {
        this.message = msg;
        this.error = '';
        setTimeout(() => this.message = '', 3000);
    }

    showError(msg: string) {
        this.error = msg;
        this.message = '';
        setTimeout(() => this.error = '', 3000);
    }
}
