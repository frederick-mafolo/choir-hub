// register.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from 'src/app/services/toast.service';
import { RoomService } from 'src/app/services/room.service';
import { Database} from '@angular/fire/database';
import { Auth, updateProfile } from '@angular/fire/auth';

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
    private auth: Auth,
    private toastService: ToastService,
    private roomService: RoomService
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

  updateDisplayName(displayName: string) {
    const user = this.auth.currentUser;
    if (!displayName.trim()) {
      this.toastService.showToast('Display name cannot be empty.', 'warning');
      return;
    }

    if (user) {
      updateProfile(user, { displayName: displayName })
        .then(() => {})
        .catch((error) => {
          this.toastService.showToast(
            'Failed to update display name.',
            'error'
          );
          console.error(error);
        });
    }
  }
  register() {
    this.route.queryParams.subscribe((params) => {
      this.roomId = params['roomId'] || null;
    });

    if (this.passwordMatch === this.password) {
      if (this.email && this.password) {
        this.authService
          .register(this.email, this.password)
          .then((userCredential) => {
            const user: any = userCredential.user;

            // Add user details (UID and email) to the Firebase database
            const token = user?.accessToken;
            const userData = {
              uid: user?.uid,
              email: user?.email,
              displayName: user.displayName || this.getUsernameFromEmail(user?.email),
            };

            this.roomService.saveUserData(userData).subscribe({
              next: () => {
                // User data saved successfully

                if (this.roomId) {
                  this.roomService
                    .joinRoom(userData, this.roomId, '')
                    .subscribe({
                      next: () => {
                        this.toastService.showToast(
                          'Successfully joined the room ',
                          'success'
                        );
                      },
                      error: (error) => {
                        // Handle any error
                        console.error(error);
                        this.toastService.showToast(
                          'Error joining room',
                          'error'
                        );
                      },
                    });
                } else{
                  this.toastService.showToast('Successfully registered', 'success');
                }
              },
              error: (error) => {
                // Handle any error
                console.error(error);
                this.toastService.showToast(
                  'Error occurred: ' + error.message,
                  'error'
                );
              },
            });
            this.updateDisplayName(userData.displayName);
            this.authService.setUserData(token, userData);

            this.router.navigate(['/home']);
          })
          .catch((error) => {
            this.toastService.showToast(
              'Error occurred: ' + error.message,
              'error'
            );
          });
      } else {
        this.toastService.showToast('Please enter your details', 'error');
      }
    } else {
      this.toastService.showToast('Passwords do not match', 'error');
    }
  }
}
