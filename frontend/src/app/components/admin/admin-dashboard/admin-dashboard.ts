import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, TranslatePipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboardComponent implements OnInit, OnDestroy {

  stats: any = null;
  isLoading: boolean = false;
  isSyncing: boolean = false;
  syncMessage: string = '';
  refreshInterval: any;

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

    // Polling de 5 segundos para atualizações em tempo real
    this.refreshInterval = setInterval(() => {
      if (!this.isSyncing) { // Evita conflito se estiver sincronizando
        this.loadStats();
        // Recarrega usuários silenciosamente (sem loading spinner)
        this.adminService.getUsers(this.usersPage).subscribe({
          next: (res: any) => {
            if (res && res.content) {
              this.users = res.content;
              this.usersTotal = res.totalElements;
              this.cdr.detectChanges();
            }
          },
          error: () => { } // Ignora erros silenciosos no polling
        });
      }
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  trackByUserId(index: number, user: any): string {
    return user.id;
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
        // Backend sends "isRunning", so checking both just in case
        if (status.isRunning || status.running) {
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

  triggerBulkImport() {
    if (confirm('ATENÇÃO: Importação em Massa (Bulk) 🚀\n\nIsso irá baixar um arquivo da Scryfall (~500MB) e importar cartas que NÃO estão no seu banco.\n\nPode demorar vários minutos. O servidor cuidará disso em segundo plano.\n\nDeseja iniciar?')) {
      this.isSyncing = true;
      this.syncMessage = 'Iniciando Bulk Import...';
      this.cdr.detectChanges();

      this.adminService.triggerBulkImport().subscribe({
        next: (res: any) => {
          this.syncMessage = res.message || 'Bulk Import iniciado!';
          this.cdr.detectChanges();
          this.pollSyncStatus(); // Reutiliza o mesmo polling de status
        },
        error: (err: any) => {
          console.error(err);
          this.syncMessage = 'Erro ao iniciar Bulk Import.';
          this.isSyncing = false;
          this.cdr.detectChanges();
        }
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

  deleteUser(user: any) {
    if (confirm(`ATENÇÃO: Você está prestes a EXCLUIR PERMANENTEMENTE o usuário ${user.name}.\nIsso não pode ser desfeito. Continuar?`)) {
      this.adminService.deleteUser(user.id).subscribe({
        next: () => {
          // Refresh list from server to ensure sync and update pagination
          this.loadUsers();
          // Force update stats too if needed
          this.loadStats();
          alert('Usuário excluído com sucesso.');
        },
        error: (err: any) => {
          console.error(err);
          alert('Erro ao excluir usuário.');
        }
      });
    }
  }
}
