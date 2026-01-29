import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CardDetailsComponent } from './components/card-details/card-details.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent }, // Home
  { path: 'card/:id', component: CardDetailsComponent }, // Página da Carta
  { path: '**', redirectTo: '' } // Qualquer erro volta pra home
];