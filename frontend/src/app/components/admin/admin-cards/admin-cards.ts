import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AdminService } from '../../../services/admin.service';

@Component({
    selector: 'app-admin-cards',
    standalone: true,
    imports: [CommonModule, RouterModule, MatIconModule],
    templateUrl: './admin-cards.html',
    styleUrls: ['./admin-cards.scss']
})
export class AdminCardsComponent implements OnInit {

    cards: any[] = [];
    page: number = 0;
    size: number = 20;
    totalPages: number = 0;
    totalElements: number = 0;
    isLoading: boolean = false;

    constructor(
        private adminService: AdminService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadCards();
    }

    loadCards() {
        this.isLoading = true;
        this.adminService.getAllCards(this.page, this.size).subscribe({
            next: (res: any) => {
                this.cards = res.content;
                this.totalPages = res.totalPages;
                this.totalElements = res.totalElements;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err: any) => {
                console.error('Erro ao carregar cartas', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    changePage(delta: number) {
        this.page += delta;
        this.loadCards();
    }
}
