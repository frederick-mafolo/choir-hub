import { Component, OnInit } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit {
  message: string = '';
  type: 'success' | 'error' | 'info' | 'warning' = 'info';
  isVisible = false;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toastState$.subscribe(toast => {
      this.message = toast.message;
      this.type = toast.type;
      this.show();
    });
  }

  show(): void {
    this.isVisible = true;
    setTimeout(() => this.hide(), 3000);
  }

  hide(): void {
    this.isVisible = false;
  }

  getClass(): string {
    switch (this.type) {
      case 'success':
        return 'toast-success';
      case 'error':
        return 'toast-error';
      case 'warning':
        return 'toast-warning';
      default:
        return 'toast-info';
    }
  }
  
}
