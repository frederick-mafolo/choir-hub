import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-delete-modal',
  templateUrl: './confirm-delete-modal.component.html',
  styleUrls: ['./confirm-delete-modal.component.scss']
})
export class ConfirmDeleteModalComponent {
  constructor(private dialogRef: MatDialogRef<ConfirmDeleteModalComponent>) {}

  confirmDeletion() {
    this.dialogRef.close(true); // Close modal with confirmation
  }
}
