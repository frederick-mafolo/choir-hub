import { Component, Output, EventEmitter, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef,OnChanges, SimpleChanges, DoCheck  } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';
import { Database, ref, set, get, push } from '@angular/fire/database';
import { RoomService } from 'src/app/services/room.service';


interface KeyGroup {
  white: Key;
  black?: Key;
}

interface Key {
  note: string;
  active: boolean;
}


@Component({
  selector: 'app-progression-editor',
  templateUrl: './progression-editor.component.html',
  styleUrls: ['./progression-editor.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressionEditorComponent implements OnInit{

  @Input() selectedSongId!: string | null; // Song ID (if selected)

  progressionForm!: FormGroup; // Main FormGroup
  leftSelected = false;
  rightSelected = false;
  bothSelected = false;
  currentRoomId!: string | null; // Room ID

  activeRowIndex: number | null = null; // Track active row for "Both" hands input
  activeColumn: 'left' | 'right' | null = null; // Track which column is selected ('left' or 'right')
  
  @Output() progressionConfirmed = new EventEmitter<string[]>();
  // Array of keys (define your piano keys here)
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
    { white: { note: 'B', active: false } }
  ];

    baseSolfegeMap: string[] = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  baseSolfegeNumbers: string[] = ['1', '2b', '2', '3b', '3', '4', '5b', '5', '6b', '6', '7b', '7'];
  dynamicSolfegeMap: Record<string, string> = {};

  constructor(private fb: FormBuilder, private db: Database,private roomService: RoomService, private cdr: ChangeDetectorRef) {
    this.initializeForm();
    this.currentRoomId = this.roomService.getRoomFromLocalStorage();
  }

  ngOnInit() {
  console.log(this.currentRoomId)
    if (this.currentRoomId) {
      this.updateSolfegeMap();
    }
    if (this.selectedSongId) {
      this.loadProgression();
    }
  }

  // ngDoCheck():void{
  //   console.log(this.currentRoomId,"Checking")
  // }


  // ngOnChanges(changes: SimpleChanges) {
  //   if (changes['currentRoomId'] && changes['currentRoomId'].currentValue) {
  //     console.log('Current Room ID changed:', changes['currentRoomId'].currentValue);
  //     this.updateSolfegeMap();

  //   }

  //   if (changes['selectedSongId'] && changes['selectedSongId'].currentValue) {
  //     console.log('Selected Song ID changed:', changes['selectedSongId'].currentValue);
  //     this.loadProgression();
  //   }
  // }
  

  initializeForm() {
    this.progressionForm = this.fb.group({
      selectedKey: ['C', Validators.required],
      songName: ['', Validators.required],
      leftProgressions: this.fb.array([]),
      rightProgressions: this.fb.array([])
    });
    this.cdr.markForCheck();

  }

  get leftProgressions(): FormArray {
    return this.progressionForm.get('leftProgressions') as FormArray;
  }

  get rightProgressions(): FormArray {
    return this.progressionForm.get('rightProgressions') as FormArray;
  }

   // Helper method to cast AbstractControl to FormControl
   asFormControl(control: any): FormControl {
    return control as FormControl;
  }


  updateSolfegeMap() {
    const selectedKeyValue = this.progressionForm.get('selectedKey')?.value;

    if (!selectedKeyValue) return; // Safeguard if selectedKey is not found
  
    const keyIndex = this.baseSolfegeMap.indexOf(selectedKeyValue);
    
    if (keyIndex === -1) return; // Handle invalid selected key
  
    // Rotate the baseSolfegeMap based on the selected key
    const rotatedNotes = [
      ...this.baseSolfegeMap.slice(keyIndex),
      ...this.baseSolfegeMap.slice(0, keyIndex)
    ];
  
    // Clear and update dynamic solfege map
    this.dynamicSolfegeMap = {};
    rotatedNotes.forEach((note, index) => {
      this.dynamicSolfegeMap[note] = this.baseSolfegeNumbers[index];
    });
  
    // Manually update the form control value to reflect the change in UI
    this.progressionForm.patchValue({
      selectedKey: selectedKeyValue
    });

    // Ensure Angular detects and processes changes
    this.cdr.markForCheck();
  }
  


  pressKey(note: string) {
    const number = this.dynamicSolfegeMap[note];
    if (!number) {
      return; // If the note doesn't exist in the solfege map, return early.
    }
  
    // Handle for 'Both' selected
    if (this.bothSelected && this.activeRowIndex !== null && this.activeColumn !== null) {
      if (this.activeColumn === 'left') {
        if (this.leftProgressions.length > this.activeRowIndex) {
          const leftRow = this.leftProgressions.at(this.activeRowIndex) as FormControl;
          leftRow.setValue(leftRow.value ? `${leftRow.value}-${number}` : number);
        }
      } else if (this.activeColumn === 'right') {
        if (this.rightProgressions.length > this.activeRowIndex) {
          const rightRow = this.rightProgressions.at(this.activeRowIndex) as FormControl;
          rightRow.setValue(rightRow.value ? `${rightRow.value}-${number}` : number);
        }
      }
    }
  
    // Handle for 'Left' selected
    else if (this.leftSelected) {
      const leftInput = this.progressionForm.get('leftProgressions') as FormArray;
  
      if (leftInput.length === 0) {
        // Add a new row if the array is empty
        leftInput.push(this.fb.control(''));
      }
  
      const currentValue = leftInput.at(0).value || '';
      leftInput.at(0).setValue(currentValue ? `${currentValue}, ${number}` : number);
    }
  
    // Handle for 'Right' selected
    else if (this.rightSelected) {
      const rightInput = this.progressionForm.get('rightProgressions') as FormArray;
  
      if (rightInput.length === 0) {
        // Add a new row if the array is empty
        rightInput.push(this.fb.control(''));
      }
  
      const currentValue = rightInput.at(0).value || '';
      rightInput.at(0).setValue(currentValue ? `${currentValue} - ${number}` : number);
    }
  
    // Manually trigger change detection after pressing a key
    this.cdr.markForCheck();
  }
  

  async loadProgression() {
    if (!this.currentRoomId || !this.selectedSongId) return;

    const progressionRef = ref(this.db, `rooms/${this.currentRoomId}/songs/${this.selectedSongId}/progression`);
    const snapshot = await get(progressionRef);
    const progressionData = snapshot.val();

    if (progressionData) {
      if (progressionData.left) {
        this.leftProgressions.patchValue(progressionData.left);
      }
      if (progressionData.right) {
        this.rightProgressions.patchValue(progressionData.right);
      }
      this.progressionForm.get('songName')?.setValue(progressionData.song || '');
    }

  }

  selectLeft() {
    this.clearProgression(); // Avoid clearing existing data for simplicity
    this.leftSelected = true;
    this.rightSelected = false;
    this.bothSelected = false;
    if (this.leftProgressions.length === 0) {
      this.leftProgressions.push(this.fb.control('', Validators.required));
    }
    this.cdr.markForCheck();
  }

  selectRight() {
    this.clearProgression();
    this.leftSelected = false;
    this.rightSelected = true;
    this.bothSelected = false;
    if (this.rightProgressions.length === 0) {
      this.rightProgressions.push(this.fb.control('', Validators.required));
    }
    this.cdr.markForCheck();
  }

  selectBoth() {
    this.clearProgression();
    this.leftSelected = false;
    this.rightSelected = false;
    this.bothSelected = true;
    if (this.leftProgressions.length === 0 && this.rightProgressions.length === 0) {
      this.leftProgressions.push(this.fb.control('', Validators.required));
      this.rightProgressions.push(this.fb.control('', Validators.required));
    }

    this.cdr.markForCheck();
  }

  addProgressionRow() {
    const leftControl = this.fb.control('', Validators.required);
    const rightControl = this.fb.control('', Validators.required);

    if (this.leftSelected) {
      this.leftProgressions.push(leftControl);
    } else if (this.rightSelected) {
      this.rightProgressions.push(rightControl);
    } else{
      this.rightProgressions.push(leftControl);
      this.leftProgressions.push(rightControl);
    }
  }

  saveProgression() {
    const selectedKey = this.progressionForm.get('selectedKey')?.value; // Get selected key
    const songName = this.progressionForm.get('songName')?.value || 'Current progression'; // Default song name if not provided
  
    if (this.currentRoomId) {
      const progression = {
        left: this.leftProgressions.length ? this.leftProgressions.value : null,
        right: this.rightProgressions.length ? this.rightProgressions.value : null,
      };
  
      const roomRef = ref(this.db, `rooms/${this.currentRoomId}`); // Reference to the current room
      const songsRef = ref(this.db, `rooms/${this.currentRoomId}/songs/`); // Reference to the songs in the room
  
      // Check if the room exists
      get(roomRef)
        .then((roomSnapshot) => {
          if (roomSnapshot.exists()) {
            // If the room exists, check for the songs
            return get(songsRef);
          } else {
            throw new Error("Room does not exist.");
          }
        })
        .then((songsSnapshot) => {
          const songsData = songsSnapshot.val() || {}; // Get songs or set an empty object if none exists
          const songId = "-O820VXRb2d8wYrLSEv5" || null; // Use the selectedSongId or generate a new one
  
          // If a song ID is provided and exists in the songs data, update the song
          if (songId && songsData[songId]) {
            const existingSongRef = ref(this.db, `rooms/${this.currentRoomId}/songs/${songId}`);
            const updatedSong = {
              id: songId,
              key: selectedKey,
              name: songName,
              progression: progression,
            };
  
            // Update the song with new key, name, and progression
            return set(existingSongRef, updatedSong);
          } else {
            // If no song ID or song doesn't exist, let Firebase generate a new ID with `push`
            const newSongRef = push(songsRef);
            const newSong = {
              id: newSongRef.key, // Firebase-generated unique ID
              key: selectedKey,
              name: songName,
              progression: progression,
            };
  
            // Save the new song to Firebase
            return set(newSongRef, newSong);
          }
        })
        .then(() => {
          console.log('Progression saved successfully!');
        })
        .catch((err) => {
          console.error('Error saving progression and song details:', err.message);
        });
    } else {
      console.log('Failed to save! No room ID found.');
    }
  
    this.clearProgression();
  }
  

  setActiveCell(rowIndex: number, column: 'left' | 'right') {
    this.activeRowIndex = rowIndex;
    this.activeColumn = column;
  }

  clearProgression() {
    const selectedKeyValue = this.progressionForm.get('selectedKey')?.value; // Preserve the selected key
    const songNameValue = this.progressionForm.get('songName')?.value; // Preserve the song name
  
    // Clear the progression arrays
    this.leftProgressions.clear();
    this.rightProgressions.clear();
  
    // Reset the form while keeping the selected key and song name intact
    this.progressionForm.reset({
      selectedKey: selectedKeyValue, // Retain the selected key
      songName: songNameValue, // Retain the song name
      leftProgressions: [], // Clear left progressions
      rightProgressions: [] // Clear right progressions
    });
  
    // Ensure change detection is triggered
    this.cdr.markForCheck();
  }
  
  

  deleteRow(index: number, isLeft: boolean) {
    if (isLeft) {
      this.leftProgressions.removeAt(index);
    } else {
      this.rightProgressions.removeAt(index);
    }
  }

  deleteBothRow(index: number) {
    this.leftProgressions.removeAt(index);
    this.rightProgressions.removeAt(index);
  }


  closePopup() {
    this.progressionConfirmed.emit([]);
  }
}
