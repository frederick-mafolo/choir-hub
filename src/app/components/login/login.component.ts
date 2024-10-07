// login.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl:'./login.component.scss'
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
   if (this.authService.isLoggedIn()) {
     this.router.navigate(['/home']);
   }
  }

  login() {
    if (this.email && this.password) {
    this.authService.login(this.email, this.password)
  }
}
}
