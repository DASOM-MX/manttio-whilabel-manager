import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { provideStore } from '@ngxs/store';

import { routes } from './app.routes';
import { ManttioPreset } from './theme/manttio-preset';
import { AppState } from './state/app/app.state';
import { SessionState } from './state/session/session.state';
import { TenantsState } from './state/tenants/tenants.state';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    provideStore([AppState, SessionState, TenantsState]),
    providePrimeNG({
      theme: {
        preset: ManttioPreset,
        options: {
          darkModeSelector: '.app-dark',
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, tailwind-utilities',
          },
        },
      },
    }),
  ],
};
