import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { oktaAuthGuard } from './okta-auth.guard';

describe('oktaAuthGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => oktaAuthGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
