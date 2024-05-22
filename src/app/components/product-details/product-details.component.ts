import { Component, OnInit } from '@angular/core';
import { Product } from '../../common/product';
import { ProductService } from '../../services/product.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../common/cart-item';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    CommonModule,
    NgxSpinnerModule,
    RouterLink,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
  ],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css',
})
export class ProductDetailsComponent implements OnInit {
  product: Product | undefined;

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => {
      this.handleProductDetails();
    });
  }

  handleProductDetails() {
    // get the "id" param string. convert string to a number using the "+" symbol
    const theProductId: number = +this.route.snapshot.paramMap.get('id')!;

    this.showSpinner();

    this.productService.getProduct(theProductId).subscribe((data) => {
      this.product = data;
      this.spinner.hide();
    });
  }

  showSpinner() {
    this.spinner.show(undefined, {
      type: 'square-spin',
      size: 'medium',
      bdColor: 'rgba(100,149,237, .8)',
      color: '#fdaed4',
      fullScreen: true,
    });
  }

  addToCart(product: Product) {
    console.log(`Adding to cart: ${product.unitPrice}`);
    const cartItem = new CartItem(product);

    this.cartService.addToCart(cartItem);
  }
}
