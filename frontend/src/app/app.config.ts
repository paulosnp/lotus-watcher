import { ApplicationConfig } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router'; // <--- Importe withRouterConfig
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, 
      withRouterConfig({ 
        onSameUrlNavigation: 'reload' // <--- ADICIONE ISSO: Força recarregamento
      })
    ),
    provideAnimationsAsync(),
    provideHttpClient()
  ]
};