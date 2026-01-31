import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // Import Location
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon'; // Import MatIconModule
import { SetService } from '../../services/set.service';

@Component({
    selector: 'app-sets',
    standalone: true,
    imports: [CommonModule, MatIconModule], // Add MatIconModule
    templateUrl: './sets.component.html',
    styleUrls: ['./sets.component.scss']
})
export class SetsComponent implements OnInit {

    sets: any[] = [];
    isLoading: boolean = true;
    errorMessage: string = '';

    constructor(
        private setService: SetService,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private location: Location // Inject Location
    ) { }

    ngOnInit(): void {
        this.setService.getSets().subscribe({
            next: (response) => {
                console.log('Sets Response:', response); // Debug Log
                if (response && response.data) {
                    // Filtrar apenas sets principais e expansões recentes
                    this.sets = response.data.filter((set: any) =>
                        ['core', 'expansion', 'masters', 'commander', 'draft_innovation'].includes(set.set_type)
                    );
                }
                this.isLoading = false;
                this.cdr.detectChanges(); // Força atualização da view
            },
            error: (err) => {
                console.error('Erro ao carregar sets', err);
                this.errorMessage = 'Não foi possível carregar as expansões. Verifique se o servidor está rodando.';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    goToSet(setCode: string) {
        this.router.navigate(['/'], { queryParams: { q: 'set:' + setCode } });
    }

    goBack() {
        this.location.back();
    }
}
