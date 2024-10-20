// register.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  email: string = '';
  password: string = '';
  passwordMatch: string = '';
  passwordStrength: string = '';
  hasLength: boolean = false;
  hasNumbers: boolean = false;
  hasLetters: boolean = false;
  hasSymbols: boolean = false;
  isDisabled: boolean = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['home']);
    }
  }

  checkPasswordStrength() {
    const lengthCheck = this.password.length >= 8;
    const numberCheck = /\d/.test(this.password);
    const letterCheck = /[a-zA-Z]/.test(this.password);
    const symbolCheck = /[!@#$%^&*(),.?":{}|<>]/.test(this.password);

    this.hasLength = lengthCheck;
    this.hasNumbers = numberCheck;
    this.hasLetters = letterCheck;
    this.hasSymbols = symbolCheck;

    if (lengthCheck && numberCheck && letterCheck && symbolCheck) {
      this.passwordStrength = 'Strong';
      this.isDisabled = false;
    } else if (lengthCheck && (numberCheck || letterCheck || symbolCheck)) {
      this.passwordStrength = 'Medium';
      this.isDisabled = true;
    } else {
      this.passwordStrength = 'Weak';
      this.isDisabled = true;
    }
  }

  register() {
    console.log('testststts');

    if (this.passwordMatch === this.password) {
      if (this.email && this.password) {
        this.authService
          .register(this.email, this.password)
          .then(() => {
            this.toastService.showToast('Successfully registered', 'success');
            this.router.navigate(['/home']);
          })
          .catch((error) => {
            this.toastService.showToast('Error occurred', 'error');
          });
      } else {
        this.toastService.showToast('Please enter your details', 'error');
      }
    }
  }
}
