import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Song } from 'src/app/models/song';

@Component({
  selector: 'app-edit-song-modal',
  templateUrl: './edit-song-modal.component.html',
  styleUrls: ['./edit-song-modal.component.scss']
})
export class EditSongModalComponent {
  constructor(
    public dialogRef: MatDialogRef<EditSongModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { song: Song }
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.dialogRef.close(this.data.song);
  }
}
