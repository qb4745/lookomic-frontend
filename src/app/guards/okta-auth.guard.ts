import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { OktaAuth } from '@okta/okta-auth-js';
import { Injector } from '@angular/core';
import myAppConfig from '../config/my-app-config';

const oktaConfig = myAppConfig.oidc;
const oktaAuth = new OktaAuth(oktaConfig);

export const oktaAuthGuard: CanActivateFn = async (
  route: any,
  state: RouterStateSnapshot
) => {
  const isAuthenticated = await oktaAuth.isAuthenticated();

  if (!isAuthenticated) {
    const injector: Injector = route.root.injector;
    const router = injector.get(Router);
    router.navigate(['/login'], { queryParams: { redirectUrl: state.url } });
    return false;
  }

  return true;
};
