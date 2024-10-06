import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<{ message: string, type: 'success' | 'error' | 'info' | 'warning' }>();
  toastState$ = this.toastSubject.asObservable();

  showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    this.toastSubject.next({ message, type });
  }
}
