import { Component, HostListener, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit  {
  title = 'Choir Hub';
  navItems = [
    { icon: 'home', label: 'Home', route: '/home' },
    { icon: 'library_add', label: 'Library', route: '/library' },
    { icon: 'build', label: 'Technical team', route: '/technical-team' },
    { icon: 'meeting_room', label: 'Manage rooms', route: '/manage-rooms' },
    { icon: 'group', label: 'User management', route: '/user-management' },
    { icon: 'settings', label: 'Profile settings', route: '/profile-settings' },
    {
      icon: 'power_settings_new',
      label: 'Log out',
      action: 'logout',
    },
  ];
  userData!: {
    uid: string;
    email: string;
    displayName: string | null;
  };

  lastScrollTop = 0; // Keep track of the last scroll position
  navbarVisible = true; // This will control the visibility of the navbar

  constructor(public authService: AuthService) {

  }

  ngOnInit(): void {
    this.authService.getUserData().subscribe((data) => {
      this.userData = data;
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    console.log('Scroll event detected');
    const currentScroll = window.scrollY || document.documentElement.scrollTop;
    console.log('hhhhhh');
    // Check scroll direction
    if (currentScroll > this.lastScrollTop) {
      console.log('Test1');
      // Scrolling down
      this.navbarVisible = false;
    } else {
      // Scrolling up
      console.log('Test2');
      this.navbarVisible = true;
    }

    // Update lastScrollTop with the current scroll position
    this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  }

  logout() {
    this.authService.logout();
  }
}
