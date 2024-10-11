import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut ,UserCredential} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { RoomService } from './room.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'authToken';
  private userKey = 'userData';

  constructor(private auth: Auth, private router: Router,private roomService: RoomService,private toastService: ToastService) {}

  // Register a user with email and password
  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  // Login a user with email and password
  login(email: string, password: string): Promise<void> {
    return signInWithEmailAndPassword(this.auth, email, password)
      .then((userCredential: UserCredential) => {
        const user = userCredential.user;
        // Get the token and save it to localStorage
        return user.getIdToken().then((token: string) => {
          localStorage.setItem(this.tokenKey, token);

          // Save user data to localStorage
          const userData = {
            uid: user.uid,
            email: user.email,
          };
          localStorage.setItem(this.userKey, JSON.stringify(userData));
         
          // Navigate to a protected route (e.g., Rooms)
          this.router.navigate(['/home']);
        });
      })
      .catch((error) => {
        console.log(error)
        this.toastService.showToast('Error occurred: invalid-credential', 'error');
        // Handle error (e.g., display error message to user)
      });
  }

  // Logout the user
  logout() {
    return signOut(this.auth).then(() => {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
      this.roomService.clearCurrentRoom();
      this.router.navigate(['']);
    });
  }

  refreshToken() {
    const user = this.auth.currentUser;
    if (user) {
      user.getIdToken(true).then((newToken) => {
        localStorage.setItem(this.tokenKey, newToken);
      });
    }
  }
  
// Check if the user is logged in based on the presence of the token in localStorage
isLoggedIn(): boolean {
  return !!localStorage.getItem(this.tokenKey);
}

 // Get the token from localStorage if needed
 getToken(): string | null {
  return localStorage.getItem(this.tokenKey);
}

 // Get user data from localStorage if needed
 getUserData(): any {
  const userData = localStorage.getItem(this.userKey);
  return userData ? JSON.parse(userData) : null;
}

}

