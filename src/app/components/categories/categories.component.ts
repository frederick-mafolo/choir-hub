import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
})
export class CategoriesComponent {
  categories = [
    { name: 'Drums', color: '#B91591' },
    { name: 'Keyboards', color: '#D90368' },
    { name: 'Vocals', color: '#DBD0CD' },
    { name: 'Guitar', color: '#7463E3' },
    { name: 'Bass', color: '#FFD400' },
    { name: 'Sound Engineers', color: '#2CF6B3' },
  ];
  

  constructor(private router: Router) {}

  navigateToCategory(categoryName: string) {
    this.router.navigate(['/messages', categoryName]);
  }
}
