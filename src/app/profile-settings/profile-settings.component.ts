import { Component ,OnInit} from '@angular/core';
import { 
  Auth, updateProfile,
  reauthenticateWithCredential, 
  EmailAuthProvider, updatePassword,
  deleteUser, onAuthStateChanged } from '@angular/fire/auth';
import { ToastService } from 'src/app/services/toast.service';
import { RoomService } from '../services/room.service';
import { AuthService } from '../services/auth.service';
import { ConfirmDeleteModalComponent } from '../confirm-delete-modal/confirm-delete-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { Database, ref, remove } from '@angular/fire/database';

@Component({
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss']
})
export class ProfileSettingsComponent implements OnInit {
  displayName: string = '';
  newPassword: string = '';
  oldPassword: string = '';
  confirmPassword: string = '';
  user!:any;
  constructor(
    private auth: Auth, 
    private toastService: ToastService, 
    private roomService: RoomService, 
    private dialog: MatDialog,
    private db: Database,
    private authService: AuthService) {
 
  }

  ngOnInit(){
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.displayName = user.displayName || ''; // Prepopulate the display name
      } else {
        this.toastService.showToast('User is not logged in.', 'warning');
      }
    });
  }
  updateDisplayName() {
   const user = this.auth.currentUser;
    if (!this.displayName.trim()) {
      this.toastService.showToast('Display name cannot be empty.', 'warning');
      return;
    }

    const userData = {
      uid: user?.uid,
      email: user?.email,
      displayName: this.displayName
    };

    if (user) {
      updateProfile(user, { displayName: this.displayName })
        .then(() => {
          this.roomService.saveUserData(userData).subscribe({
            next: () => {
              // User data saved successfully
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
          this.authService.setUserData('', userData);
          this.toastService.showToast('Display name updated successfully.', 'success');
        })
        .catch((error) => {
          this.toastService.showToast('Failed to update display name.', 'error');
          console.error(error);
        });
    }
  }

  changePassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.toastService.showToast('Passwords do not match.', 'warning');
      return;
    }
  
    if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
      this.toastService.showToast('All fields are required.', 'warning');
      return;
    }
  
    const user = this.auth.currentUser;
  
    if (user && user.email) {
      // Re-authenticate the user
      const credential = EmailAuthProvider.credential(user.email, this.oldPassword);
      reauthenticateWithCredential(user, credential)
        .then(() => {
          // If re-authentication succeeds, update the password
          return updatePassword(user, this.newPassword);
        })
        .then(() => {
          this.toastService.showToast('Password changed successfully.', 'success');
          this.oldPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
        })
        .catch((error) => {
          if (error.code === 'auth/wrong-password') {
            this.toastService.showToast('Old password is incorrect.', 'error');
          } else {
            this.toastService.showToast('Failed to change password.', 'error');
            console.error(error);
          }
        });
    } else {
      this.toastService.showToast('User is not authenticated.', 'error');
    }
  }

  openDeleteAccountModal() {
    const dialogRef = this.dialog.open(ConfirmDeleteModalComponent, {
      width: '300px',
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteAccount();
      }
    });
  }

  deleteAccount() {
    const user = this.auth.currentUser;
  
    if (user) {
      const userRef = ref(this.db, `users/${user.uid}`);
  
      // First remove the user data from the database
      remove(userRef)
        .then(() => {
          // Then delete the user from Firebase Authentication
          return deleteUser(user);
        })
        .then(() => {
          this.authService.logout();
          this.toastService.showToast(
            'Account and data deleted successfully.',
            'success'
          );
        })
        .catch((error) => {
          this.toastService.showToast('Failed to delete account.', 'error');
          console.error('Error deleting account or data:', error);
        });
    } else {
      this.toastService.showToast('User is not authenticated.', 'error');
    }
  }
  
}
