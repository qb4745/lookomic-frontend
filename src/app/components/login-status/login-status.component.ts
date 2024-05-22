import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OKTA_AUTH, OktaAuthStateService } from '@okta/okta-angular';
import OktaAuth, { UserClaims as OktaUserClaims } from '@okta/okta-auth-js';

@Component({
  selector: 'app-login-status',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './login-status.component.html',
  styleUrl: './login-status.component.css',
})
export class LoginStatusComponent implements OnInit {
  isAuthenticated: boolean = false;
  userName: string = '';

  storage: Storage = localStorage;

  constructor(
    private oktaAuthStateService: OktaAuthStateService,
    @Inject(OKTA_AUTH) private oktaAuth: OktaAuth
  ) {}

  ngOnInit(): void {
    this.oktaAuthStateService.authState$.subscribe((result) => {
      this.isAuthenticated = result.isAuthenticated!;
      this.setUserDetails();
    });
  }

  async setUserDetails() {
    if (this.isAuthenticated) {
      try {
        const response: OktaUserClaims = await this.oktaAuth.getUser();
        if (response === null) {
          this.handleUserDetailsFallback();
          return console.error('User details are null');
        }
        const fullNamesNonFormatted = response.name as string;

        const fullNameOnlyLetters = this.cleanStringToLettersOnly(
          fullNamesNonFormatted
        );

        const nameParts = fullNameOnlyLetters.split(' ');

        const capitalizeFirstLetter = (str: string) =>
          str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

        const firstName = capitalizeFirstLetter(nameParts[0]);
        this.userName = firstName;
        if (nameParts.length > 1) {
          const lastName = capitalizeFirstLetter(nameParts[1]);
          this.storage.setItem('userName', JSON.stringify(firstName));
          this.storage.setItem('userLastName', JSON.stringify(lastName));
        }

        const email = this.retrieveUserEmail(response);
        this.storage.setItem('userEmail', JSON.stringify(email));
      } catch (error) {
        console.error('Error getting user details:', error);
        this.handleUserDetailsFallback();
      }
    }
  }

  handleUserDetailsFallback() {
    this.userName = 'Usuario';
  }

  retrieveUserEmail(response: OktaUserClaims) {
    return response.email;
  }

  logout() {
    this.oktaAuth.signOut();
  }

  cleanStringToLettersOnly(input: string): string {
    const cleanedInput = input.replace(/[^a-zA-Z]+/g, ' ');

    return cleanedInput.replace(/\s+/g, ' ').trim();
  }
}
