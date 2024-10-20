import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
  email: string = '';
  constructor(private authService: AuthService,private router: Router){}

  resetPassword():void{
    if (!this.email) {
      console.error('Email is required');
      return;
    }
    
    this.authService.resetPassword(this.email)
      .then(() => {
        alert('Password reset link sent to your email. Please check your inbox.');
        this.router.navigate(['/login']);
      })
      .catch((error) => {
        alert('Error sending password reset email. Please try again.');
        console.error(error);
      });
  }
}
