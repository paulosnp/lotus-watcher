import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CardDetailsComponent } from './components/card-details/card-details.component';
import { SetsComponent } from './components/sets/sets.component';
import { WatchlistComponent } from './components/watchlist/watchlist.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent }, // Home
  { path: 'sets', component: SetsComponent }, // Expansões
  { path: 'watchlist', component: WatchlistComponent }, // Minha Lista
  { path: 'card/:id', component: CardDetailsComponent }, // Página da Carta
  { path: '**', redirectTo: '' } // Qualquer erro volta pra home
];