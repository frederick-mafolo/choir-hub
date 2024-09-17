import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { PianoService } from '../../services/piano.service';
import { ToastService } from '../../services/toast.service';
import { Database, ref, set, push, onValue } from '@angular/fire/database';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { RoomService } from '../../services/room.service';
import { EditSongModalComponent } from '../edit-song-modal/edit-song-modal.component';
import { DeleteConfirmationModalComponent } from '../delete-confirmation-modal/delete-confirmation-modal.component';
import { MatDialog } from '@angular/material/dialog';

interface Key {
  note: string;
  active: boolean;
}

interface KeyGroup {
  white: Key;
  black?: Key; // Optional black key
}

@Component({
  selector: 'app-piano',
  templateUrl: './piano.component.html',
  styleUrls: ['./piano.component.scss'],
})
export class PianoComponent implements OnInit {
  @ViewChild('audioPlayer') audioPlayerRef!: ElementRef;
  currentRoomId: string = '';
  pressedKey: string | null = null; // Currently pressed key
  showProgressionEditor: boolean = false;
  showRooms:boolean = false;
  newSong = { name: '', key: '' };
  songs: { id: string, name: string, key: string }[] = [];
  currentProgression: string[] = [];

  keys: KeyGroup[] = [
    {
      white: { note: 'C', active: false },
      black: { note: 'C#', active: false },
    },
    {
      white: { note: 'D', active: false },
      black: { note: 'Eb', active: false },
    },
    { white: { note: 'E', active: false } },
    {
      white: { note: 'F', active: false },
      black: { note: 'F#', active: false },
    },
    {
      white: { note: 'G', active: false },
      black: { note: 'Ab', active: false },
    },
    {
      white: { note: 'A', active: false },
      black: { note: 'Bb', active: false },
    },
    { white: { note: 'B', active: false } },
  ];


  constructor(
    private pianoService: PianoService,
    private toastService: ToastService,
    private db: Database,
    private roomService: RoomService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // Subscribe to the current room from RoomService
    this.roomService.currentRoom$.subscribe((roomId) => {
      this.currentRoomId = roomId || ''; // Update the current room ID
      if (this.currentRoomId) {
        this.listenForKeyPresses(this.currentRoomId);
      }
    });

    this.getAllSongs();
  }

  getAllSongs(): void {
    if (!this.currentRoomId) {
      return;
    }
  
    const songsRef = ref(this.db, `rooms/${this.currentRoomId}/songs`);
    onValue(songsRef, (snapshot) => {
      const songList = snapshot.val() || {};
      this.songs = Object.keys(songList).map(key => ({
        id: key,
        ...songList[key]
      }));
    });
  }
  

   // Add a new song to Firebase
   addSong() {
    if (!this.currentRoomId) {
      this.toastService.showToast('Please join a room first', 'warning');
      return;
    }
  
    let isEmpty = Object.values(this.newSong).every(value => value === '');

    if(isEmpty){
      this.toastService.showToast('Invalid form', 'error');
      return
    }
     

    const songRef = push(ref(this.db, `rooms/${this.currentRoomId}/songs`));
    set(songRef, this.newSong).then(() => {
      this.newSong = { name: '', key: '' }; // Reset the form
    });
  }
  
// Edit song
editSong(index: number) {
  if (!this.currentRoomId) {
    alert('Please join a room first');
    return;
  }

  const song = this.songs[index];
  const dialogRef = this.dialog.open(EditSongModalComponent, {
    width: '250px',
    data: { song: { ...song } }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      set(ref(this.db, `rooms/${this.currentRoomId}/songs/${song.id}`), result);
    }
  });
}

// Delete song
deleteSong(id: string) {
  if (!this.currentRoomId) {
    alert('Please join a room first');
    return;
  }

  const dialogRef = this.dialog.open(DeleteConfirmationModalComponent, {
    width: '250px'
  });

  dialogRef.afterClosed().subscribe(confirmed => {
    if (confirmed) {
      const songRef = ref(this.db, `rooms/${this.currentRoomId}/songs/${id}`);
      set(songRef, null);
    }
  });
}

  // Handle drag and drop for rearranging songs
  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.songs, event.previousIndex, event.currentIndex);
    // You may want to update the song order in Firebase here if needed
  }

  onRoomJoined(roomId: string) {
    this.roomService.setCurrentRoom(roomId);
    this.currentRoomId = roomId;
    this.listenForKeyPresses(this.currentRoomId);
    this.getAllSongs();
  }

  // Function to listen to keypress events in Firebase for the current room
  listenForKeyPresses(roomId: string) {
    const roomRef = ref(this.db, `rooms/${roomId}/piano-key`);
    onValue(roomRef, (snapshot) => {
      const keyData = snapshot.val();
      if (keyData && keyData.note) {
        // Reset all keys to inactive
        this.keys.forEach((keyGroup) => {
          keyGroup.white.active = false;
          if (keyGroup.black) {
            keyGroup.black.active = false;
          }
        });

        // Activate the pressed key
        this.keys.forEach((keyGroup) => {
          if (keyGroup.white.note === keyData.note) {
            keyGroup.white.active = true;
          }
          if (keyGroup.black && keyGroup.black.note === keyData.note) {
            keyGroup.black.active = true;
          }
        });
        this.highlightKey(keyData.note); // Highlight the note for all users in the room
      }
    });
  }

  // Join a session and listen for keypress events
  playSound(note: string) {
    if (!this.currentRoomId) {
      alert('Please create or join a room first.');
      return;
    }

    // Reset all keys to inactive
    this.keys.forEach((keyGroup) => {
      keyGroup.white.active = false;
      if (keyGroup.black) {
        keyGroup.black.active = false;
      }
    });

    // Activate the pressed key
    this.keys.forEach((keyGroup) => {
      if (keyGroup.white.note === note) {
        keyGroup.white.active = true;
      }
      if (keyGroup.black && keyGroup.black.note === note) {
        keyGroup.black.active = true;
      }
    });

    // Store or update keypress event in Firebase
    const keyData = { note: note, timestamp: Date.now() };

    set(ref(this.db, `rooms/${this.currentRoomId}/piano-key`), keyData)
      .then(() => {
        this.pressedKey = note;
      })
      .catch((error) => {
        console.error('Error updating note in room:', error);
      });
  }

  highlightKey(note: string) {
    this.pressedKey = note; // Update the pressed key display
  }

  selectSong(song: { name: string; key: string }) {
    alert(`Selected Song: ${song.name}, Key: ${song.key}`);
  }


   // Update the progression when confirmed from the child component
   updateProgression(progression: string[]) {
    this.currentProgression = progression;
    this.closeProgressionEditor(); // Close the editor after confirming
  }

  updateRooom(){
    this.closeRooms()
  }

  openProgressionEditor() {
    this.showProgressionEditor = true;
  }

  openRooms() {
    this.showRooms = true;
  }

  closeRooms(){
    this.showRooms= false;
  }
  // Close the progression editor
  closeProgressionEditor() {
    this.showProgressionEditor = false;
  }

  clearCurrentProgression() {
    this.currentProgression = [];
  }
}
