import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CardDetailsComponent } from './components/card-details/card-details.component';
import { SetsComponent } from './components/sets/sets.component';
import { WatchlistComponent } from './components/watchlist/watchlist.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { VerifyEmailComponent } from './components/auth/verify-email/verify-email.component';
import { AdminGuard } from './guards/admin.guard';
import { AdminSudoGuard } from './guards/admin-sudo.guard';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard';
import { SudoLoginComponent } from './components/admin/sudo-login/sudo-login';
import { AdminCardsComponent } from './components/admin/admin-cards/admin-cards';
import { ProfileComponent } from './components/profile/profile.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent }, // Home
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [AdminGuard, AdminSudoGuard] // Proteção dupla: Admin + Sudo Mode
  },
  { path: 'admin/cards', component: AdminCardsComponent, canActivate: [AdminGuard, AdminSudoGuard] },
  { path: 'admin/sudo-login', component: SudoLoginComponent }, // Tela de confirmação de senha
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'verify', component: VerifyEmailComponent }, // Verificação de Email
  { path: 'profile', component: ProfileComponent }, // Meu Perfil
  { path: 'sets', component: SetsComponent }, // Expansões
  { path: 'watchlist', component: WatchlistComponent }, // Minha Lista
  { path: 'card/:id', component: CardDetailsComponent }, // Página da Carta
  { path: '**', redirectTo: '' } // Qualquer erro volta pra home
];