import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CardDetailsComponent } from './components/card-details/card-details.component';
import { SetsComponent } from './components/sets/sets.component';
import { WatchlistComponent } from './components/watchlist/watchlist.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { VerifyEmailComponent } from './components/auth/verify-email/verify-email.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent }, // Home
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'verify', component: VerifyEmailComponent }, // Verificação de Email
  { path: 'sets', component: SetsComponent }, // Expansões
  { path: 'watchlist', component: WatchlistComponent }, // Minha Lista
  { path: 'card/:id', component: CardDetailsComponent }, // Página da Carta
  { path: '**', redirectTo: '' } // Qualquer erro volta pra home
];