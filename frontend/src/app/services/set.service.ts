import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SetService {

    private apiUrl = 'http://localhost:8080/api/cards';

    constructor(private http: HttpClient) { }

    getSets(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/sets`);
    }
}
