// register.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
    styleUrl:'./register.component.scss'
})
export class RegisterComponent implements OnInit{
  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router,private toastService: ToastService) {}


  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['home']);
    }
   }
 
  register() {

    if (this.email && this.password) {
    this.authService.register(this.email, this.password)
      .then(() => {
        this.toastService.showToast('Successfully registered', 'success');
        this.router.navigate(['/home'])})
      .catch(error => {this.toastService.showToast('Error occurred', 'error');    });

    } else {
      this.toastService.showToast('Please enter your details', 'error'); 
    }
  }
}
