import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
})
export class CategoriesComponent {
  categories = [
    { name: 'Drums' },
    { name: 'Keyboards'},
    { name: 'Vocals'},
    { name: 'Guitar'},
    { name: 'Bass'},
    { name: 'Sound Engineers' },
  ];

  constructor(private router: Router) {}

  navigateToCategory(categoryName: string) {
    this.router.navigate(['/messages', categoryName]);
  }
}
