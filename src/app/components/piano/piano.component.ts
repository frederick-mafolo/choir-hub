import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { PianoService } from '../../services/piano.service';
import { ToastService } from '../../services/toast.service';
import {
  Database,
  ref,
  set,
  push,
  onValue,
  get,
  update,
  remove,
} from '@angular/fire/database';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { RoomService } from '../../services/room.service';
import { EditSongModalComponent } from '../edit-song-modal/edit-song-modal.component';
import { DeleteConfirmationModalComponent } from '../delete-confirmation-modal/delete-confirmation-modal.component';
import { MatDialog } from '@angular/material/dialog';
import html2canvas from 'html2canvas';
import { AuthService } from 'src/app/services/auth.service';
interface Key {
  note: string;
  active: boolean;
}

export interface Progression {
 progression:{ left?: string[], right?: string[]};
 songName:''
}

interface KeyGroup {
  white: Key;
  black?: Key; 
}

@Component({
  selector: 'app-piano',
  templateUrl: './piano.component.html',
  styleUrls: ['./piano.component.scss'],
})
export class PianoComponent implements OnInit {
  @ViewChild('audioPlayer') audioPlayerRef!: ElementRef;
  currentRoomId: string | null = '';
  pressedKey: string | null = null; 
  showProgressionEditor: boolean = false;
  showRooms: boolean = false;
  newSong = { name: '', key: '', order: 0 };
  songs: {
    order: number;
    id: string;
    name: string;
    key: string;
    progression: [];
  }[] = [];

  songData!: {};

  selectedSongIndex: number = 0;
  progressions: { [id: string]: any } = {}; 
  selectedSongId: string | null = null;
  selectedSong: any = null;
  selectedProgression: any = null; 

  progressionData: any = {}; 

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
  isOverWrittenClicked: boolean = false;
  currentRoomName!: string;

  userData!: {
    uid: string;
    email: string;
    name: string;
  };

  constructor(
    private pianoService: PianoService,
    private toastService: ToastService,
    private db: Database,
    private roomService: RoomService,
    private dialog: MatDialog,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.authService.getUserData().subscribe((data) => {
      this.userData = data;
    });
  }

  ngOnInit() {
    // Subscribe to the current room from RoomService
    this.roomService.currentRoom$.subscribe((res:any) => {
      this.currentRoomId = res?.id || null;
      this.currentRoomName =  res?.name || res?.id;
      if (this.currentRoomId) {
        this.listenForKeyPresses(this.currentRoomId);
      }
      
    });

    this.getAllSongs();
  }

  getAllSongs(): void {
    if (!this.currentRoomId) return;
    const songsRef = ref(this.db, `rooms/${this.currentRoomId}/songs`);
    onValue(songsRef, (snapshot) => {
      const songList = snapshot.val() || {};
      this.songs = Object.keys(songList).map((key) => ({
        id: key,
        ...songList[key],
      }));

      this.songs.sort((a, b) => a.order - b.order);

      // Populate progressions array with song progression data
      this.songs.forEach((song) => {
        if (song.progression) {
          this.progressions[song.id] = song.progression;
        }
      });

      // Set default song and progression (first song)
      if (this.songs.length > 0) {
        this.songData = this.selectedSongIndex ? this.songs[this.selectedSongIndex] : this.songs[0];
        this.selectedSongId = this.selectedSongIndex ? this.songs[this.selectedSongIndex].id : this.songs[0].id;
        this.selectedSong = this.selectedSongIndex ? this.songs[this.selectedSongIndex] : this.songs[0]; // Default to first song
        this.selectedProgression = this.progressions[this.selectedSongId];
      }

      this.cdr.markForCheck(); // Trigger change detection if needed
    });
  }

  // Function to handle song click and update progression
  onSongClick(songId: string, index: number): void {
    this.songData = this.songs[index];
    this.selectedSongId = songId;
    this.selectedSong = this.songs.find((song) => song.id === songId);
    this.selectedProgression = this.progressions[songId];
    this.selectedSongIndex = index;
    this.cdr.markForCheck(); 
  }

  
  updateProgression(progressionData: Progression) {
    if(this.isOverWrittenClicked){
      this.closeProgressionEditor();
      return;
    }

    if ((progressionData.progression?.left == undefined 
      && progressionData.progression?.right == undefined) 
      || (progressionData.progression.left == null 
      && progressionData.progression.right == null)){
   
      delete this.progressions[this.selectedSongId as string];
      this.selectedProgression = null;
      this.closeProgressionEditor();
      return;
    }
    else { 
      console.log(progressionData.songName)
      this.roomService.setActivityLog(`added progression on song: ${progressionData.songName} `, this.userData, this.currentRoomId as string).subscribe({
        next: () => {},
        error: (err) =>{ console.error('Failed to log activity:', err)}
       }); 

    this.selectedSongIndex = this.selectedSongIndex;
    this.selectedProgression = progressionData.progression;
    }
    this.closeProgressionEditor(); // Close the editor after confirming
  }
  // Add a new song to Firebase
  addSong() {
    if (!this.currentRoomId) {
      this.toastService.showToast('Please join a room first', 'warning');
      return;
    }

    let isEmpty = Object.values(this.newSong).every((value) => value === '');

    // if (!isEmpty) {
    //   this.toastService.showToast('Invalid form', 'error');
    //   return;
    // }

    this.newSong.order = this.songs.length + 1;

    const songRef = push(ref(this.db, `rooms/${this.currentRoomId}/songs`));
    set(songRef, this.newSong).then(() => {
      this.roomService.setActivityLog(`added ${this.newSong.name} song to the room`, this.userData, this.currentRoomId as string).subscribe({
        next: () => console.log('Join activity logged.'),
        error: (err) => console.error('Failed to log join activity:', err),
      });
      this.newSong = { name: '', key: '', order: 0 }; // Reset the form
    });
  }

  // Edit song
  editSong(id:string, index: number) {
    if (!this.currentRoomId) {
      this.toastService.showToast('Please join a room first', 'warning');
      return;
    }

    const song = this.songs[index];
    const dialogRef = this.dialog.open(EditSongModalComponent, {
      width: '250px',
      data: { song: { ...song } },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        set(
          ref(this.db, `rooms/${this.currentRoomId}/songs/${id}`),
          result
        ).then(() => {   
          this.roomService.setActivityLog(`edited ${result.name} song`, this.userData, this.currentRoomId as string).subscribe({
          next: () => console.log('Join activity logged.'),
          error: (err) => console.error('Failed to log join activity:', err),
        }); 
      }).catch( (e) => { console.error(e)  })
      }
    });
  }

  deleteProgression(): void {
    if (!this.selectedSongId || !this.currentRoomId) {
      console.log('No song or room selected.');
      return;
    }

    if (this.progressions && this.progressions[this.selectedSongId]) {
      delete this.progressions[this.selectedSongId];
    }

    const progressionRef = ref(
      this.db,
      `rooms/${this.currentRoomId}/songs/${this.selectedSongId}/progression`
    );

    remove(progressionRef)
      .then(() => {
        this.toastService.showToast(
          'Progression deleted successfully!',
          'success'
        );
        console.log(this.selectedSong)
        this.roomService.setActivityLog(`deleted progression song :${this.selectedSong.name} `, this.userData, this.currentRoomId as string).subscribe({
          next: () => console.log('Activity logged.'),
          error: (err) => console.error('Failed to log activity:', err),
        }); 
        this.selectedProgression = null;
      })
      .catch((error) => {
        this.toastService.showToast('Error deleting progression', 'error');
        console.error('Error deleting progression:', error);
      });
  }

  shareProgression(): void {
    const tableElement = document.querySelector(
      '.progression-table'
    ) as HTMLElement;

    if (tableElement) {
      html2canvas(tableElement)
        .then((canvas) => {
          // Convert the canvas to a Blob
          canvas.toBlob((blob) => {
            if (!blob) return;

            // Create a file from the Blob
            const file = new File([blob], 'progression.png', {
              type: 'image/png',
            });

            // Use the Web Share API to share the image if supported
            if (navigator.share && navigator.canShare({ files: [file] })) {
              navigator
                .share({
                  title: 'Song Progression',
                  text: 'Check out this progression!',
                  files: [file], // Share the image file
                })
                .then(() => {
                    this.roomService.setActivityLog(`Shared progression song :${this.selectedSong.name} `, this.userData, this.currentRoomId as string).subscribe({
                      next: () => console.log('Activity logged.'),
                      error: (err) => console.error('Failed to log activity:', err),
                     }); 
                })
                .catch((error) => {
                  console.error('Error sharing progression:', error);
                });
            } else {
              console.log('Sharing not supported on this device.');
            }
          }, 'image/png');
        })
        .catch((error) => {
          console.error('Error generating image:', error);
        });
    }
  }

  // Delete song
  deleteSong(id: string, index: number) {
    if (!this.currentRoomId) {
      this.toastService.showToast('Please join a room first', 'warning');
      return;
    }
    const data = {
      message: this.songs[index].name
    };

    const dialogRef = this.dialog.open(DeleteConfirmationModalComponent, {
      width: '250px',
      data: { ...data },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        const songRef = ref(this.db, `rooms/${this.currentRoomId}/songs/${id}`);
        remove(songRef)
          .then(() => {
            this.roomService.setActivityLog(`deleted song : ${data.message} `, this.userData, this.currentRoomId as string).subscribe({
              next: () => console.log('Activity logged.'),
              error: (err) => console.error('Failed to log activity:', err),
             }); 
            this.reIndexSongs();
          })
          .catch((error) => {
            this.toastService.showToast('Error deleting song', 'error');
            console.error('Error deleting song:', error);
          });
      }
    });
  }

  reIndexSongs(): void {
    const songsRef = ref(this.db, `rooms/${this.currentRoomId}/songs`);
    get(songsRef)
      .then((snapshot) => {
        const songList = snapshot.val() || {};
        const songs = Object.keys(songList).map((key, index) => ({
          id: key,
          ...songList[key],
          order: index + 1, // Reassign sequential order based on the index
        }));

        // Update the songs with the new order values
        songs.forEach((song) => {
          const songRef = ref(
            this.db,
            `rooms/${this.currentRoomId}/songs/${song.id}`
          );
          set(songRef, song);
        });
      })
      .catch((error) => {
        this.toastService.showToast('Error re-indexing songs', 'success');
        console.error('Error re-indexing songs:', error);
      });
  }

  // Handle drag and drop for rearranging songs
  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.songs, event.previousIndex, event.currentIndex);
    // You may want to update the song order in Firebase here if needed
    this.updateSongOrderInFirebase();

    // Update the selectedSongIndex if the highlighted item was moved
    if (this.selectedSongIndex === event.previousIndex) {
      this.selectedSongIndex = event.currentIndex;
    } else if (
      this.selectedSongIndex > event.previousIndex &&
      this.selectedSongIndex <= event.currentIndex
    ) {
      this.selectedSongIndex--; // Adjust index if an item was dragged upwards
    } else if (
      this.selectedSongIndex < event.previousIndex &&
      this.selectedSongIndex >= event.currentIndex
    ) {
      this.selectedSongIndex++; // Adjust index if an item was dragged downwards
    }

    this.cdr.markForCheck(); // Ensure the UI updates
  }

  // Method to update the song order in Firebase
  updateSongOrderInFirebase(): void {
    const updates: any = {};

    this.songs.forEach((song, index) => {
      // Each song will now have an order/index property
      song.order = index; // Set the new order locally
      const songRef = `rooms/${this.currentRoomId}/songs/${song.id}`;
      updates[songRef] = song;
    });

    // Update Firebase with the new order for each song
    const dbRef = ref(this.db);
    update(dbRef, updates)
      .then(() => {})
      .catch((error) => {
        this.toastService.showToast('Error updating song order', 'error');
        console.error('Error updating song order:', error);
      });
  }

  onRoomJoined(roomId: string) {
    this.roomService.setCurrentRoom(roomId,this.currentRoomName);
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
      this.toastService.showToast(
        'Please create or join a room first.',
        'warning'
      );
      return;
    }

    this.roomService.setActivityLog(`pressed: ${note} `, this.userData, this.currentRoomId as string).subscribe({
      next: () => {},
      error: (err) =>{ console.error('Failed to log activity:', err)}
     }); 

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
        this.toastService.showToast('Error updating note in room', 'error');
        console.error('Error updating note in room:', error);
      });
  }

  highlightKey(note: string) {
    this.pressedKey = note; // Update the pressed key display
  }


  closeProgressionEditor() {
    this.showProgressionEditor = false;
  }

 
  updateRooom() {
    this.closeRooms();
  }

  overwriteSelectedSongData() {
    this.isOverWrittenClicked = true;
    this.songData = {};
    this.openProgressionEditor();
  }

  addProgression(){
    this.isOverWrittenClicked = false; 
    if (!this.currentRoomId) {
      this.toastService.showToast(
        'Please create or join a room first.',
        'warning'
      );
      return;
    }

    this.openProgressionEditor()
  }

  openProgressionEditor() {
   
    this.showProgressionEditor = true;
  }

  openRooms() {
    this.showRooms = true;
  }

  closeRooms() {
    this.showRooms = false;
  }
}
