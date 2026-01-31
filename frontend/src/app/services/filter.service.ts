import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class FilterService {

    private showFiltersSource = new BehaviorSubject<boolean>(false);
    showFilters$ = this.showFiltersSource.asObservable();

    constructor() { }

    toggleFilters() {
        this.showFiltersSource.next(!this.showFiltersSource.value);
    }

    setFiltersVisible(isVisible: boolean) {
        this.showFiltersSource.next(isVisible);
    }
}
