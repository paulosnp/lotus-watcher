import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router'; // Importe Router
import { CommonModule } from '@angular/common'; // Importe CommonModule para usar *ngIf
import { SearchComponent } from './components/search/search.component';
import { Footer } from './components/footer/footer';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SearchComponent, CommonModule, Footer], // Add CommonModule
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  isHomePage: boolean = true;

  constructor(private router: Router) {
    // Monitora cada troca de página
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Se a URL for '/', estamos na Home
      this.isHomePage = (event.url === '/' || event.urlAfterRedirects === '/');
    });
  }
}