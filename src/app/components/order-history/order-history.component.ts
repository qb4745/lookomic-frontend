import { Component, OnInit } from '@angular/core';
import { OrderHistory } from '../../common/order-history';
import { OrderHistoryService } from '../../services/order-history.service';
import { CommonModule } from '@angular/common';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es-CL'; // Import Chilean Spanish locale
import { DatePipe } from '@angular/common';

registerLocaleData(localeEs, 'es-CL'); // Register the locale data

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.css',
})
export class OrderHistoryComponent implements OnInit {
  orderHistoryList: OrderHistory[] = [];
  storage: Storage = localStorage;

  datePipe: DatePipe = new DatePipe('es-CL');

  showNoResultsMessage = false;

  constructor(private orderHistoryService: OrderHistoryService) {}

  ngOnInit(): void {
    this.handleOrderHistory();
  }
  getFormattedDate(dateValue: string | Date | null): string {
    if (!dateValue) {
      return '';
    }

    const dateString =
      typeof dateValue === 'string' ? dateValue : dateValue.toISOString();

    return this.datePipe.transform(dateString, 'fullDate') || '';
  }

  handleOrderHistory() {
    const userEmailString = this.storage.getItem('userEmail');

    if (userEmailString === null) {
      console.error('User email is not stored in the storage');
      return;
    }

    let userEmail: string;
    try {
      userEmail = JSON.parse(userEmailString);
    } catch (error) {
      console.error('Failed to parse user email from storage:', error);
      return;
    }

    if (typeof userEmail !== 'string') {
      console.error('User email stored in the storage is not a string');
      return;
    }

    this.orderHistoryService.getOrderHistory(userEmail).subscribe({
      next: (data) => {
        if (data._embedded.orders) {
          this.orderHistoryList = data._embedded.orders;
        } else {
          console.error('Unexpected response from the order history service');
        }
      },
      error: (error) => {
        console.error('Error occurred while fetching order history:', error);
      },
    });
    this.showMessageAfterDelay(() => this.orderHistoryList.length === 0);
  }
  showMessageAfterDelay(condition: () => boolean, delay: number = 2000) {
    setTimeout(() => {
      this.showNoResultsMessage = condition();
    }, delay);
  }
}
