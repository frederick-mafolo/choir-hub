import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent implements OnInit {

 constructor(private authService: AuthService, private router: Router){}

 ngOnInit() {
  if (this.authService.isLoggedIn()) {
    this.router.navigate(['home']);
  }
 }
}
