// register.component.ts
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
    styleUrl:'./register.component.scss'
})
export class RegisterComponent {
  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router,private toastService: ToastService) {}

  register() {

    if (this.email && this.password) {
    this.authService.register(this.email, this.password)
      .then(() => {
        this.toastService.showToast('Successfully registered', 'success');
        this.router.navigate(['/piano'])})
      .catch(error => {this.toastService.showToast('Error occurred', 'error');    });

    } else {
      this.toastService.showToast('Please enter your details', 'error'); 
    }
  }
}
