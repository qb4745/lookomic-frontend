import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { Product } from '../../common/product';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../common/cart-item';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NgxSpinnerModule,
    NgbPaginationModule,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  currentCategoryId: number = 1;
  previousCategoryId: number = 1;
  currentCategoryName: string = '';
  searchMode: boolean = false;
  showNoResultsMessage = false;

  // pagination
  pageNumber: number = 1;
  pageSize: number = 12; // tamaño paginación
  totalElements: number = 0;

  // search
  previousKeyword: string = '';

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => {
      this.listProducts();
    });
  }

  listProducts() {
    this.searchMode = this.route.snapshot.paramMap.has('keyword');

    this.showNoResultsMessage = false;

    if (this.searchMode) {
      this.handleSearchProducts();
      return;
    }

    this.handleListProducts();
  }

  handleSearchProducts() {
    const keyword: string = this.route.snapshot.paramMap.get('keyword')!;

    // check if the previousKeyword and keyword are the same
    // reset pageNumber because a new keyword has been typed
    if (this.previousKeyword != keyword) {
      this.pageNumber = 1;
    }

    this.previousKeyword = keyword;

    this.productService
      .seachProductsPaginate(this.pageNumber - 1, this.pageSize, keyword)
      .subscribe(this.processResult());
    this.showMessageAfterDelay(() => this.products.length === 0);
  }

  handleListProducts() {
    const hasCategoryId: boolean = this.route.snapshot.paramMap.has('id');

    if (hasCategoryId) {
      this.currentCategoryId = Number(this.route.snapshot.paramMap.get('id')!);
      this.currentCategoryName =
        this.route.snapshot.paramMap.get('category-name')!;
    }

    // Check if we have a different category than previous
    // Note: angular will reuse a component if it is currently being viewed
    //

    // if we have a different category id than previous
    // then set pageNumber back to 1

    if (this.previousCategoryId != this.currentCategoryId) {
      this.pageNumber = 1;
    }

    this.previousCategoryId = this.currentCategoryId;

    this.showSpinner();

    this.productService
      .getProductListPaginate(
        this.pageNumber - 1,
        this.pageSize,
        this.currentCategoryId
      )
      .subscribe(this.processResult());

    this.showMessageAfterDelay(() => this.products.length === 0);
    this.spinner.hide();
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

  // Show spinner after 1 second
  showMessageAfterDelay(condition: () => boolean, delay: number = 1000) {
    setTimeout(() => {
      this.showNoResultsMessage = condition();
    }, delay);
  }

  updatePageSize(pageSize: string) {
    this.pageSize = +pageSize;
    this.pageNumber = 1;
    this.listProducts();
  }

  processResult() {
    return (data: any) => {
      this.products = data._embedded.products;
      this.pageNumber = data.page.number + 1;
      this.pageSize = data.page.size;
      this.totalElements = data.page.totalElements;
    };
  }

  addToCart(product: Product) {
    this.cartService.addToCart(new CartItem(product));
  }
}
