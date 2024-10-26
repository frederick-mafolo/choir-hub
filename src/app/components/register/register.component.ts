// register.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from 'src/app/services/toast.service';
import { RoomService } from 'src/app/services/room.service';
import { Database, ref, set } from '@angular/fire/database';

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
  roomId: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private db: Database,
    private toastService: ToastService,
    private roomService: RoomService,
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

  getUsernameFromEmail(email: string): string {
    if (!email) return ''; // Handle cases where email is empty or null
    const username = email.split('@')[0]; // Get the part before '@'
    return username.replace(/\./g, ' '); // Replace dots with spaces
  }
  register() {
    this.route.queryParams.subscribe(params => {
      this.roomId = params['roomId'] || null;
    });

    if (this.passwordMatch === this.password) {
      if (this.email && this.password) {
        this.authService.register(this.email, this.password)
          .then((userCredential) => { 
            const user:any = userCredential.user;
          
            // Add user details (UID and email) to the Firebase database
           const token = user?.accessToken
            const userData = {
              uid: user?.uid,
              email: user?.email ,
              name:user.displaName || this.getUsernameFromEmail(user?.email)
            };

           this.authService.setUserData(token,userData);
  
            // Save the user data to the 'users' node in Firebase Database or Firestore
            const userRef = ref(this.db, `users/${user.uid}`);
            set(userRef, {email : userData.email})
              .then(() => {
                if (this.roomId) {
                  this.roomService.joinRoom(userData,this.roomId, '').subscribe({
                    next: () => {
                      this.toastService.showToast('Successfully joined the room ', 'success');
                    },
                    error: (error) => {
                      // Handle any error
                      console.error(error)
                      this.toastService.showToast('Error joining room', 'error');
                    }
                
                  }); // Add user to the room after registration
                } else {
                  this.toastService.showToast('Successfully registered', 'success');
                }
                this.router.navigate(['/home']);

              
              })
              .catch((dbError) => {
                this.toastService.showToast('Error saving user data: ' + dbError.message, 'error');
              });
          })
          .catch((error) => {
            this.toastService.showToast('Error occurred: ' + error.message, 'error');
          });
      } else {
        this.toastService.showToast('Please enter your details', 'error');
      }
    } else {
      this.toastService.showToast('Passwords do not match', 'error');
    }
  }
  
}
