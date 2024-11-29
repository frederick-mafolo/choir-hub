import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-member',
  templateUrl: './add-member.component.html',
  styleUrl: './add-member.component.scss'
})
export class AddMemberComponent {
  addMemberForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddMemberComponent>
  ) {
    this.addMemberForm = this.fb.group({
      email: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      )]]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onCreate(): void {
    if (this.addMemberForm.valid) {
      const email = this.addMemberForm.get('email')?.value;
      this.dialogRef.close(email); // Return the room name when the modal is closed
    }
  }

}
