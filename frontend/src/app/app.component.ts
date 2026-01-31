import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon'; // Import MatIconModule
import { SearchComponent } from './components/search/search.component';
import { Footer } from './components/footer/footer';
import { filter } from 'rxjs/operators';
import { CardService } from './services/card.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, SearchComponent, CommonModule, Footer, MatIconModule], // Add RouterModule
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  isHomePage: boolean = true;

  constructor(private router: Router, private cardService: CardService) {
    // Monitora cada troca de página
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Se a URL for '/', estamos na Home
      this.isHomePage = (event.url === '/' || event.urlAfterRedirects === '/');
    });
  }

  onRandomCard() {
    this.cardService.getRandomCard().subscribe(card => {
      if (card && card.id) {
        this.router.navigate(['/card', card.id]);
      }
    });
  }
}