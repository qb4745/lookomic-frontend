import {
  Component,
  Inject,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  FloatLabelType,
  MatFormFieldModule,
} from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { ShopFormService } from '../../services/shop-form.service';
import { Region } from '../../common/region';
import { Comuna } from '../../common/comuna';
import { FormShopValidators } from '../../validators/form-shop-validators';
import { CartService } from '../../services/cart.service';
import { CheckoutService } from '../../services/checkout.service';
import { Router } from '@angular/router';
import { Purchase } from '../../common/purchase';
import { Order } from '../../common/order';
import { OrderItem } from '../../common/order-item';
import { from, Observable, of, switchMap } from 'rxjs';
import { OKTA_AUTH, OktaAuthStateService } from '@okta/okta-angular';
import OktaAuth, { UserClaims as OktaUserClaims } from '@okta/okta-auth-js';
import { environment } from '../../../environments/environment';
import { PaymentInfo } from '../../common/payment-info';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSelectModule,
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent implements OnInit {
  @ViewChild('creditCardCardNumberErrorType')
  creditCardCardNumberErrorType!: TemplateRef<any>;
  checkoutFormGroup: FormGroup = new FormGroup({});
  hideRequiredControl = new FormControl(false);
  floatLabelControl = new FormControl('auto' as FloatLabelType);

  totalPrice: number = 0;
  totalQuantity: number = 0;

  startMonth: number = new Date().getMonth() + 1;
  creditCardYears: number[] = [];
  creditCardMonths: number[] = [];

  regiones: Region[] = [];
  regionNombre: string = '';

  shippingAddressComunas: Comuna[] = [];
  billingAddressComunas: Comuna[] = [];

  storage: Storage = localStorage;
  isAuthenticated: boolean = false;
  userEmail: string = '';
  userName: string = '';
  userLastName: string = '';

  // initialize Stripe API
  stripe = Stripe(environment.stripePublishableKey);

  paymentInfo: PaymentInfo = new PaymentInfo();
  cardElement: any;
  displayError: any = '';

  isIrAPagarButtonDisabled: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private shopFormService: ShopFormService,
    private cartService: CartService,
    private checkoutService: CheckoutService,
    private router: Router,
    private oktaAuthStateService: OktaAuthStateService,
    @Inject(OKTA_AUTH) private oktaAuth: OktaAuth
  ) {}

  ngOnInit(): void {
    // setup Stripe payment form
    this.setupStripePaymentForm();

    this.oktaAuthStateService.authState$.subscribe((result) => {
      this.isAuthenticated = result.isAuthenticated!;
      this.getUserDetails();
    });
    this.reviewCartDetails();

    this.checkoutFormGroup = this.formBuilder.group({
      customer: this.formBuilder.group({
        firstName: new FormControl(
          {
            value: this.userName,
            disabled: this.hasUserDetail(this.userName),
          },
          {
            validators: [
              Validators.required,
              Validators.minLength(2),
              FormShopValidators.trimValue,
              FormShopValidators.onlyLetters,
            ],
            updateOn: 'blur',
          }
        ),
        lastName: new FormControl(
          {
            value: this.userLastName,
            disabled: this.hasUserDetail(this.userLastName),
          },
          {
            validators: [
              Validators.required,
              Validators.minLength(2),
              FormShopValidators.trimValue,
              FormShopValidators.onlyLetters,
            ],
            updateOn: 'blur',
          }
        ),
        email: new FormControl(
          {
            value: this.userEmail,
            disabled: this.hasUserDetail(this.userEmail),
          },
          {
            validators: [
              Validators.required,
              Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$'),
              FormShopValidators.trimValue,
            ],
            updateOn: 'blur',
          }
        ),
      }),
      shippingAddress: this.formBuilder.group({
        street: new FormControl('', {
          validators: [
            Validators.required,
            Validators.minLength(5),
            FormShopValidators.trimValue,
            FormShopValidators.notOnlyNumbers,
            FormShopValidators.onlyLettersAndNumbersInSpanish,
          ],
          updateOn: 'blur',
        }),
        city: new FormControl('', {
          validators: [
            Validators.required,
            Validators.minLength(2),
            FormShopValidators.trimValue,
            FormShopValidators.notOnlyNumbers,
            FormShopValidators.onlyLettersAndNumbersInSpanish,
          ],
          updateOn: 'blur',
        }),
        comuna: new FormControl(
          { value: '', disabled: false },
          {
            validators: [Validators.required, FormShopValidators.isPristine],
          }
        ),
        region: new FormControl('', {
          validators: [Validators.required],
        }),
        zipCode: new FormControl('', {
          validators: [
            Validators.required,
            Validators.minLength(7),
            Validators.maxLength(7),
            FormShopValidators.trimValue,
            FormShopValidators.onlyNumbers,
          ],
          updateOn: 'blur',
        }),
      }),
      billingAddress: this.formBuilder.group({
        street: [''],
        city: [''],
        comuna: [''],
        region: [''],
        zipCode: [''],
      }),
      creditCard: this.formBuilder.group({}),
    });

    this.shopFormService.getRegionesList().subscribe((data) => {
      this.regiones = data;
    });
  }

  hasUserDetail(userDetail: string): boolean {
    // Check if userDetail is not null, not undefined, and not an empty string
    if (!userDetail) {
      return false;
    }

    return true;
  }

  setupStripePaymentForm() {
    const elements = this.stripe.elements();

    // Create a card element ... and hide the zip-code field
    this.cardElement = elements.create('card', { hidePostalCode: true });

    // Add an instance of card UI component into the 'card-element' div
    this.cardElement.mount('#card-element');

    // Add event binding for the 'change' event on the card element
    this.cardElement.on('change', (event: any) => {
      // get a handle to card-errors element
      this.displayError = document.getElementById('card-errors');

      if (event.complete) {
        this.displayError.textContent = '';
      } else if (event.error) {
        // show validation error to customer
        this.displayError.textContent = event.error.message;
      }
    });
  }

  getFloatLabelValue(): FloatLabelType {
    return this.floatLabelControl.value || 'auto';
  }

  copyShippingAddresstoBillingAddress(event: any) {
    if (event.target.checked) {
      this.checkoutFormGroup.controls['billingAddress'].setValue(
        this.checkoutFormGroup.controls['shippingAddress'].value
      );

      this.billingAddressComunas = this.shippingAddressComunas;
      return;
    }
    this.checkoutFormGroup.controls['billingAddress'].reset();
    this.billingAddressComunas = [];
  }
  handleMonthsAndYears() {
    const creditCardFormGroup = this.checkoutFormGroup.get('creditCard');
    const currentYear: number = new Date().getFullYear();
    const selectedYear: number = Number(
      creditCardFormGroup?.get('expirationYear')?.value
    );

    let startMonth: number = new Date().getMonth() + 1;
    if (currentYear === selectedYear) {
      startMonth = new Date().getMonth() + 1;
      this.getCreditCardMonths(startMonth);
      return;
    }

    startMonth = 1;

    this.getCreditCardMonths(startMonth);
  }
  disabled: boolean = true;

  getCreditCardMonths(startMonth: number): void {
    this.shopFormService.getCreditCardMonths(startMonth).subscribe((data) => {
      this.creditCardMonths = data;
    });
  }

  getComunasByRegionId(FormGroupName: string) {
    const formGroup = this.checkoutFormGroup.get(FormGroupName);
    const regionId = formGroup?.get('region')?.getRawValue();

    this.shopFormService
      .getComunasListByRegionId(regionId)
      .subscribe((data) => {
        if (FormGroupName === 'shippingAddress') {
          this.shippingAddressComunas = data;
        } else {
          this.billingAddressComunas = data;
        }

        formGroup?.get('comuna')?.setValue(data[0]);
      });
  }

  reviewCartDetails() {
    this.cartService.totalQuantity.subscribe(
      (data) => (this.totalQuantity = data)
    );
    this.cartService.totalPrice.subscribe((data) => (this.totalPrice = data));
  }

  get firstName() {
    return this.checkoutFormGroup.get('customer.firstName');
  }
  get lastName() {
    return this.checkoutFormGroup.get('customer.lastName');
  }
  get email() {
    return this.checkoutFormGroup.get('customer.email');
  }
  //
  //
  get shippingAddressStreet() {
    return this.checkoutFormGroup.get('shippingAddress.street');
  }
  get shippingAddressCity() {
    return this.checkoutFormGroup.get('shippingAddress.city');
  }

  get shippingAddressComuna() {
    return this.checkoutFormGroup.get('shippingAddress.comuna');
  }
  get shippingAddressRegion() {
    return this.checkoutFormGroup.get('shippingAddress.region');
  }
  get shippingAddressZipCode() {
    return this.checkoutFormGroup.get('shippingAddress.zipCode');
  }
  //
  //
  get billingAddressStreet() {
    return this.checkoutFormGroup.get('billingAddress.street');
  }
  get billingAddressCity() {
    return this.checkoutFormGroup.get('billingAddress.city');
  }
  get billingAddressComuna() {
    return this.checkoutFormGroup.get('billingAddress.comuna');
  }
  get billingAddressRegion() {
    return this.checkoutFormGroup.get('billingAddress.region');
  }
  get billingAddressZipCode() {
    return this.checkoutFormGroup.get('billingAddress.zipCode');
  }
  //
  //

  get creditCardCardType() {
    return this.checkoutFormGroup.get('creditCard.cardType');
  }
  get creditCardNameOnCard() {
    return this.checkoutFormGroup.get('creditCard.nameOnCard');
  }
  get creditCardCardNumber() {
    return this.checkoutFormGroup.get('creditCard.cardNumber');
  }
  get creditCardSecurityCode() {
    return this.checkoutFormGroup.get('creditCard.securityCode');
  }
  get creditCardExpirationMonth() {
    return this.checkoutFormGroup.get('creditCard.expirationMonth');
  }
  get creditCardeExpirationYear() {
    return this.checkoutFormGroup.get('creditCard.expirationYear');
  }

  onSubmit() {
    console.log('Handling the submit button');

    if (this.checkoutFormGroup.invalid) {
      this.markFormAsTouched();
      return;
    }

    const purchase = this.preparePurchase();
    this.computePaymentInfo(purchase);

    if (this.isFormValid()) {
      this.isIrAPagarButtonDisabled = true;

      this.processPayment(purchase)
        .pipe(switchMap((result) => this.placeOrder(purchase, result)))
        .subscribe({
          next: (response) => this.handleSuccessfulOrder(purchase, response),
          error: (error) => {
            this.handlePaymentError(error);
            this.isIrAPagarButtonDisabled = false;
          },
        });
    } else {
      this.markFormAsTouched();
      this.isIrAPagarButtonDisabled = false;
    }
  }

  private isFormValid(): boolean {
    return (
      !this.checkoutFormGroup.invalid && this.displayError.textContent === ''
    );
  }

  private markFormAsTouched(): void {
    this.checkoutFormGroup.markAllAsTouched();
  }

  private processPayment(purchase: Purchase): Observable<any> {
    return this.checkoutService.createPaymentIntent(this.paymentInfo).pipe(
      switchMap((paymentIntentResponse) => {
        return from(
          this.stripe.confirmCardPayment(
            paymentIntentResponse.client_secret,
            {
              payment_method: {
                card: this.cardElement,
                billing_details: {
                  email: purchase.customer.email,
                  name: `${purchase.customer.firstName} ${purchase.customer.lastName}`,
                  address: {
                    line1: purchase.billingAddress.street,
                    city: purchase.billingAddress.city,
                    state: purchase.billingAddress.comuna,
                    postal_code: purchase.billingAddress.zipCode,
                    country: 'CL',
                  },
                },
              },
            },
            { handleActions: false }
          )
        );
      }),
      switchMap((result: any) => {
        if (result.error) {
          throw new Error(result.error.message);
        }
        return of(result);
      })
    );
  }

  private placeOrder(purchase: Purchase, result: any): Observable<any> {
    return this.shopFormService
      .getRegionById(+purchase.shippingAddress.region)
      .pipe(
        switchMap((regionName: string) => {
          purchase.billingAddress.region = regionName;
          purchase.shippingAddress.region = regionName;
          return this.checkoutService.placeOrder(purchase);
        })
      );
  }

  private handlePaymentError(error: Error): void {
    alert(`Hubo un error al procesar su compra`);
    this.isIrAPagarButtonDisabled = false;
  }

  private computePaymentInfo(purchase: Purchase) {
    this.paymentInfo.amount = this.totalPrice;
    this.paymentInfo.currency = 'CLP';
    this.paymentInfo.receiptEmail = purchase.customer.email;
  }

  preparePurchase(): Purchase {
    const order = new Order();
    order.totalPrice = this.totalPrice;
    order.totalQuantity = this.totalQuantity;

    const cartItems = this.cartService.cartItems;
    const orderItems: OrderItem[] = cartItems.map(
      (cartItem) => new OrderItem(cartItem)
    );

    let purchase = new Purchase();
    purchase.customer = this.checkoutFormGroup.controls['customer'].value;
    purchase.billingAddress =
      this.checkoutFormGroup.get('shippingAddress')?.value;
    purchase.shippingAddress =
      this.checkoutFormGroup.get('shippingAddress')?.value;
    purchase.order = order;
    purchase.orderItems = orderItems;

    return purchase;
  }

  handleSuccessfulOrder(purchase: Purchase, response: any) {
    const purchaseDetails = {
      customer: `${purchase.customer.firstName}, ${purchase.customer.lastName}, ${purchase.customer.email}`,
      shippingAddress: `${purchase.shippingAddress.street}, ${purchase.shippingAddress.city}, ${purchase.shippingAddress.comuna}, ${purchase.shippingAddress.region}, ${purchase.shippingAddress.zipCode}`,
      billingAddress: `${purchase.billingAddress.street}, ${purchase.billingAddress.city}, ${purchase.billingAddress.comuna}, ${purchase.billingAddress.region}, ${purchase.billingAddress.zipCode}`,
      order: `${purchase.order.totalPrice}, ${purchase.order.totalQuantity}`,
    };

    alert(
      `Su orden ha sido recibida.\nSu número de pedido es: ${response.orderTrackingNumber}`
    );
    this.resetCart();
    this.isIrAPagarButtonDisabled = false;
  }

  resetCart() {
    this.cartService.cartItems = [];
    this.cartService.totalPrice.next(0);
    this.cartService.totalQuantity.next(0);
    this.cartService.persistCartItems();

    this.checkoutFormGroup.reset();

    this.router.navigateByUrl('/products');
  }

  getUserDetails() {
    const userEmailString = this.storage.getItem('userEmail');
    const userNameString = this.storage.getItem('userName');
    const userLastNameString = this.storage.getItem('userLastName');

    if (
      userEmailString === null ||
      userNameString === null ||
      userLastNameString === null
    ) {
      console.error('User details are not stored in the storage');
      return;
    }

    try {
      this.userEmail = JSON.parse(userEmailString);
      this.userName = JSON.parse(userNameString);
      this.userLastName = JSON.parse(userLastNameString);
    } catch (error) {
      console.error('Failed to parse user details from storage:', error);
      return;
    }

    if (typeof this.userEmail !== 'string') {
      console.error('User details stored in the storage is not a string');
      return;
    }
  }

  handleUserDetailsFallback() {
    this.userName = 'Usuario';
  }

  retrieveUserEmail(response: OktaUserClaims) {
    return response.email;
  }
}
