import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { from, lastValueFrom, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OKTA_AUTH } from '@okta/okta-angular';
import OktaAuth from '@okta/okta-auth-js';

@Injectable({
  providedIn: 'root',
})
export class AuthInterceptorService implements HttpInterceptor {
  constructor(@Inject(OKTA_AUTH) private oktaAuth: OktaAuth) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return from(this.handleAccess(request, next));
  }

  private async handleAccess(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Promise<HttpEvent<any>> {
    // access token for secured endpoints
    const securedEndpoints = [`${environment.apiUrl}/orders`];

    if (securedEndpoints.some((url) => request.urlWithParams.includes(url))) {
      // get access token
      const accessToken = this.oktaAuth.getAccessToken();

      if (accessToken) {
        //console.log('Access Token:', accessToken); // Debugging log

        // clone the request and add new header with access token
        request = request.clone({
          setHeaders: {
            Authorization: 'Bearer ' + accessToken,
          },
        });
      } else {
        console.warn('No access token available'); // Debugging log
      }
    }

    return await lastValueFrom(next.handle(request));
  }
}
