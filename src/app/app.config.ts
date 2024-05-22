import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { OktaAuthModule } from '@okta/okta-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(OktaAuthModule),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimations(),
  ],
};
