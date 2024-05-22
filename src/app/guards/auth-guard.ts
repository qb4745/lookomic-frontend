import { inject } from '@angular/core';
import {
  CanActivateChildFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { OktaAuth } from '@okta/okta-auth-js';
import myAppConfig from '../config/my-app-config';

const oktaConfig = myAppConfig.oidc;
const oktaAuth = new OktaAuth(oktaConfig);

export const authGuard: CanActivateChildFn = async (
  childRoute: any,
  state: RouterStateSnapshot
) => {
  const router = inject(Router);
  const isAuthenticated = await oktaAuth.isAuthenticated();

  if (!isAuthenticated) {
    return router.createUrlTree(['/login'], {
      queryParams: { redirectUrl: state.url },
    });
  }

  return true;
};
