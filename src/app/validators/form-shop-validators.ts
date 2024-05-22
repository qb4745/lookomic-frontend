import { FormControl, ValidationErrors } from '@angular/forms';

export class FormShopValidators {
  static notOnlyWhitespace(control: FormControl): ValidationErrors {
    if (control.value != null && control.value.trim().length === 0) {
      return { notOnlyWhitespace: true };
    }
    return {};
  }

  static trimValue(control: FormControl): ValidationErrors | null {
    const value = control.value;
    if (!value || typeof value !== 'string') {
      return null;
    }

    const trimmedValue = value.trim();
    if (value !== trimmedValue) {
      control.setValue(trimmedValue);
    }
    return null;
  }

  static onlyNumbersError(
    control: FormControl
  ): { [key: string]: boolean } | null {
    if (control.value !== undefined && isNaN(control.value)) {
      return { onlyNumbersError: true };
    }
    return null;
  }

  static onlyNumbers(control: FormControl): ValidationErrors | null {
    if (control.value !== undefined && control.value !== null) {
      const regex = /^[0-9]+$/;
      if (!regex.test(control.value.toString())) {
        return { onlyNumbers: true };
      }
    }
    return null;
  }

  static notOnlyNumbers(control: FormControl): ValidationErrors | null {
    if (control.value !== undefined && control.value !== null) {
      const regex = /^[0-9]+$/;
      if (regex.test(control.value.toString())) {
        return { notOnlyNumbers: true };
      }
    }
    return null;
  }

  static onlyLetters(control: FormControl): ValidationErrors | null {
    if (control.value !== undefined && control.value !== null) {
      const regex = /^[a-zA-Z\s]+$/;
      if (!regex.test(control.value.toString())) {
        return { onlyLetters: true };
      }
    }
    return null;
  }
  static onlyLettersAndNumbersInSpanish(
    control: FormControl
  ): ValidationErrors | null {
    if (control.value !== undefined && control.value !== null) {
      const regex = /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑüÜ]+$/;
      if (!regex.test(control.value.toString())) {
        return { onlyLettersAndNumbers: true };
      }
    }
    return null;
  }

  static isPristine(control: FormControl): ValidationErrors | null {
    if (control.pristine) {
      return { isPristine: true };
    }
    return null;
  }

  static isValidCreditCard(control: FormControl): ValidationErrors | null {
    // Check if the control value is not null or undefined
    if (control.value === null || control.value === undefined) {
      return null; // Return null to skip the validation
    }

    const cardNumber = control.value.toString().replace(/\s/g, '');

    // Check card length
    if (cardNumber.length !== 16) {
      return { isValidCreditCard: true };
    }

    // Determine card type
    const firstDigits = cardNumber.slice(0, 2);
    let cardType: string;
    if (['51', '52', '53', '54', '55'].includes(firstDigits)) {
      cardType = 'MasterCard';
    } else if (firstDigits[0] === '4') {
      cardType = 'Visa';
    } else if (['34', '37'].includes(firstDigits)) {
      cardType = 'American Express';
    } else if (
      ['6011', '644', '645', '646', '647', '648', '649', '65'].includes(
        firstDigits
      )
    ) {
      cardType = 'Diners Club';
    } else {
      cardType = 'Desconocida';
    }

    // Luhn algorithm
    let sum = 0;
    let isSecondDigitDoubled = false;
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i], 10);
      if (isSecondDigitDoubled) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
      isSecondDigitDoubled = !isSecondDigitDoubled;
    }

    if (sum % 10 === 0) {
      return null; // Valid credit card
    } else {
      return { isValidCreditCard: true }; // Invalid credit card
    }
  }
}
