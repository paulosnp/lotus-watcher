import { Pipe, PipeTransform, Inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { LanguageService } from '../services/language.service';
import { Subscription } from 'rxjs';

@Pipe({
    name: 'translate',
    pure: false, // Impure to update when signal changes (though angular signals might handle it, impure is safer for now)
    standalone: true
})
export class TranslatePipe implements PipeTransform {

    constructor(private languageService: LanguageService) { }

    transform(key: string): string {
        return this.languageService.getTranslation(key);
    }
}
