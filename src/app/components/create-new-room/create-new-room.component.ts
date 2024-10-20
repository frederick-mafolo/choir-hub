import { Component, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-create-new-room',
  templateUrl: './create-new-room.component.html',
  styleUrls: ['./create-new-room.component.scss']
})
export class CreateNewRoomComponent {

  createRoomForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateNewRoomComponent>
  ) {
    this.createRoomForm = this.fb.group({
      roomName: ['', Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onCreate(): void {
    if (this.createRoomForm.valid) {
      const roomName = this.createRoomForm.get('roomName')?.value;
      this.dialogRef.close(roomName); // Return the room name when the modal is closed
    }
  }


  createRoom() {
  
  }
}
