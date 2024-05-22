import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { ProductService } from './app/services/product.service';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import myAppConfig from './app/config/my-app-config';
import { OKTA_CONFIG, OktaAuthModule } from '@okta/okta-angular';

import { OktaAuth } from '@okta/okta-auth-js';
import { AuthInterceptorService } from './app/services/auth-interceptor.service';

const oktaConfig = {
  ...myAppConfig.oidc,
  features: myAppConfig.features,
  idps: myAppConfig.idps,
  idpDisplay: myAppConfig.idpDisplay,
};

const oktaAuth = new OktaAuth(oktaConfig);

bootstrapApplication(AppComponent, {
  providers: [
    ...appConfig.providers,
    provideHttpClient(withInterceptorsFromDi()),
    ProductService,
    { provide: OKTA_CONFIG, useValue: { oktaAuth } },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptorService,
      multi: true,
    },
    provideAnimations(),
    provideAnimationsAsync(),
  ],
}).catch((err) => console.error(err));
