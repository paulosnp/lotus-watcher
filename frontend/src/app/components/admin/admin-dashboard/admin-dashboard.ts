import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboardComponent implements OnInit {

  stats: any = null;
  isLoading: boolean = false;
  isSyncing: boolean = false;
  syncMessage: string = '';

  // User Management
  users: any[] = [];
  usersPage: number = 0;
  usersTotal: number = 0;

  currentUserId: string | null = null;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadStats();
    this.loadUsers();
  }

  loadCurrentUser() {
    this.authService.getMe().subscribe({
      next: (user: any) => {
        this.currentUserId = user.id;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar usuário atual', err)
    });
  }

  loadStats() {
    this.isLoading = true;
    this.adminService.getStats().subscribe({
      next: (data: any) => {
        this.stats = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erro ao carregar stats', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  triggerSync() {
    if (confirm('Tem certeza? Isso pode levar alguns minutos.')) {
      this.isSyncing = true;
      this.syncMessage = 'Iniciando sincronização...';
      this.cdr.detectChanges();

      this.adminService.triggerSync().subscribe({
        next: (res: any) => {
          this.syncMessage = res.message || 'Sincronização iniciada!';
          this.cdr.detectChanges();
          this.pollSyncStatus();
        },
        error: (err: any) => {
          this.syncMessage = 'Erro ao iniciar sincronização.';
          this.isSyncing = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  pollSyncStatus() {
    this.adminService.getSyncStatus().subscribe({
      next: (status: any) => {
        if (status.running) {
          this.syncMessage = `Sincronizando: ${status.current}/${status.total} (${status.percent}%)`;
          this.isSyncing = true;
          this.cdr.detectChanges();
          setTimeout(() => this.pollSyncStatus(), 2000);
        } else {
          this.isSyncing = false;
          this.syncMessage = '✅ Sincronização concluída com sucesso!';
          this.loadStats();
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.isSyncing = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadUsers() {
    this.adminService.getUsers(this.usersPage).subscribe({
      next: (res: any) => {
        // Fallback checks
        if (res && res.content) {
          this.users = res.content;
          this.usersTotal = res.totalElements;
        } else {
          console.warn('Estrutura de resposta inesperada:', res);
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.syncMessage = 'Erro ao carregar usuários: ' + err.message; // Reuse syncMessage for global feedback or add new one
        this.cdr.detectChanges();
      }
    });
  }

  toggleUserStatus(user: any) {
    const action = user.enabled ? 'Bloquear' : 'Desbloquear';
    if (confirm(`Deseja realmente ${action} o usuário ${user.name}?`)) {
      this.adminService.toggleUserStatus(user.id).subscribe({
        next: (res: any) => {
          user.enabled = res.enabled;
          this.cdr.detectChanges();
        },
        error: (err: any) => console.error(err)
      });
    }
  }

  toggleUserRole(user: any) {
    if (user.role === 'ADMIN' && !confirm('ATENÇÃO: Rebaixar um Admin pode remover seu próprio acesso se for você mesmo. Continuar?')) {
      return;
    }

    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const action = user.role === 'ADMIN' ? 'Rebaixar para Usuário' : 'Promover a Admin';

    if (confirm(`Deseja realmente ${action} o usuário ${user.name}?`)) {
      this.adminService.toggleUserRole(user.id).subscribe({
        next: (res: any) => {
          user.role = res.role;
          this.cdr.detectChanges();
        },
        error: (err: any) => console.error(err)
      });
    }
  }
}
