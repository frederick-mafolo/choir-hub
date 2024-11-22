import { Component ,Inject} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-blocked-users-dialog',
  templateUrl: './blocked-users-dialog.component.html',
  styleUrl: './blocked-users-dialog.component.scss'
})
export class BlockedUsersDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { blockedUsers: any[] },
    private dialogRef: MatDialogRef<BlockedUsersDialogComponent>
  ) {}

  unblockUser(userId: string) {
    this.dialogRef.close(userId);  // Return the ID of the user to unblock
  }

  closePopup() {
    this.dialogRef.close(); 
  }
  
}
