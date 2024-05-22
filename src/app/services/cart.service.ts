import { Injectable } from '@angular/core';
import { CartItem } from '../common/cart-item';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  cartItems: CartItem[] = [];

  totalPrice: Subject<number> = new BehaviorSubject<number>(0);

  totalQuantity: Subject<number> = new BehaviorSubject<number>(0);

  storage: Storage = localStorage;

  constructor() {
    const cartItemsString = this.storage.getItem('cartItems');
    const data = this.parseCartItems(cartItemsString);

    if (data !== null) {
      this.cartItems = data;
      this.computeCartTotals();
    }
  }

  private parseCartItems(cartItemsString: string | null): any | null {
    try {
      return cartItemsString ? JSON.parse(cartItemsString) : null;
    } catch (error) {
      console.error('Error parsing cart items:', error);
      return null;
    }
  }

  addToCart(cartItem: CartItem) {
    let existingCartItem: CartItem | undefined = this.cartItems?.find(
      (item) => item.id === cartItem.id
    );
    let alreadyExistsInCart: boolean = existingCartItem !== undefined;

    if (alreadyExistsInCart) {
      existingCartItem!.quantity++;
      this.computeCartTotals();
      return;
    }
    this.cartItems.push(cartItem);
    this.computeCartTotals();
  }

  decrementQuantity(cartItem: CartItem) {
    cartItem.quantity--;

    if (cartItem.quantity === 0) {
      this.remove(cartItem);
      return;
    }
    this.computeCartTotals();
  }

  remove(cartItem: CartItem) {
    const itemIndex = this.cartItems.findIndex(
      (tempCartItem) => tempCartItem.id === cartItem.id
    );

    if (itemIndex != -1) {
      this.cartItems.splice(itemIndex, 1);

      this.computeCartTotals();
    }
  }

  computeCartTotals() {
    let totalPriceValue: number = 0;
    let totalQuantityValue: number = 0;

    this.cartItems.forEach((cartItem: CartItem) => {
      totalPriceValue += cartItem.quantity * cartItem.unitPrice;
      totalQuantityValue += cartItem.quantity;
    });

    this.totalPrice.next(totalPriceValue);
    this.totalQuantity.next(totalQuantityValue);

    this.persistCartItems();
  }

  persistCartItems(): void {
    try {
      const cartItemsString: string = JSON.stringify(this.cartItems);
      this.storage.setItem('cartItems', cartItemsString);
    } catch (error) {
      console.error('Error persisting cart items:', error);
    }
  }

  logCartData(totalPriceValue: number, totalQuantityValue: number) {
    console.log('Contenido del Carro');

    this.cartItems.forEach((tempCartItem: CartItem) => {
      const subTotalPrice = tempCartItem.quantity * tempCartItem.unitPrice;
      console.log(
        `name: ${tempCartItem.name}, quantity: ${tempCartItem.quantity}, unitPrice= ${tempCartItem.unitPrice}, subTotalPrice= ${subTotalPrice}`
      );
    });

    console.log(
      `totalPrice: ${totalPriceValue.toFixed(
        2
      )}, totalQuantity: ${totalQuantityValue}`
    );

    console.log('-----');
  }
}
