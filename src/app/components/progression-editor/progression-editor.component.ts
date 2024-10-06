import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  Input,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  FormControl,
} from '@angular/forms';
import { Database, ref, set, get, push } from '@angular/fire/database';
import { RoomService } from 'src/app/services/room.service';
import { ToastService } from '../../services/toast.service';
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
})
export class ProgressionEditorComponent implements OnInit {
  @Input() songData!: any; 

  progressionForm!: FormGroup; 
  leftSelected = false;
  rightSelected = false;
  bothSelected = false;
  currentRoomId!: string | null; 
  progression!:any;
  activeRowIndex: number | null = null;
  activeColumn: 'left' | 'right' | null = null; 

  @Output() progressionConfirmed = new EventEmitter<any>();

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
    { white: { note: 'B', active: false } },
  ];

  baseSolfegeMap: string[] = [
    'C',
    'C#',
    'D',
    'Eb',
    'E',
    'F',
    'F#',
    'G',
    'Ab',
    'A',
    'Bb',
    'B',
  ];
  baseSolfegeNumbers: string[] = [
    '1',
    '2b',
    '2',
    '3b',
    '3',
    '4',
    '5b',
    '5',
    '6b',
    '6',
    '7b',
    '7',
  ];
  dynamicSolfegeMap: Record<string, string> = {};

  constructor(
    private fb: FormBuilder,
    private db: Database,
    private roomService: RoomService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
  ) {
    this.initializeForm();
    this.currentRoomId = this.roomService.getRoomFromLocalStorage();
  }

  ngOnInit() {
    if (this.currentRoomId) {
      this.updateSolfegeMap();
    }

    if (this.songData?.id) {
      // Patch the simple values first (selectedKey and songName)
      this.progressionForm.patchValue({
        selectedKey: this.songData?.key,
        songName: this.songData?.name,
      });

      if (this.songData.progression) {
        this.progression = this.songData.progression;
        if (this.songData.progression?.left != undefined && !this.songData.progression?.right ) {
          this.leftSelected = true;
          // Handle the leftProgressions array
          const leftProgressionsArray = this.progressionForm.get(
            'leftProgressions'
          ) as FormArray;
          leftProgressionsArray.clear(); // Clear existing values
          this.songData.progression.left.forEach((leftProg: string) => {
            leftProgressionsArray.push(
              this.fb.control(leftProg, Validators.required)
            );
          });
        } else if (this.songData.progression.right != undefined && !this.songData.progression?.left ) {
          this.rightSelected = true;
          // Handle the rightProgressions array
          const rightProgressionsArray = this.progressionForm.get(
            'rightProgressions'
          ) as FormArray;
          rightProgressionsArray.clear(); // Clear existing values
          this.songData.progression.right.forEach((rightProg: string) => {
            rightProgressionsArray.push(
              this.fb.control(rightProg, Validators.required)
            );
          });
        } else if (
          this.songData.progression.right &&
          this.songData.progression.left
        ) {
          this.bothSelected = true;

          const leftProgressionsArray = this.progressionForm.get(
            'leftProgressions'
          ) as FormArray;
          leftProgressionsArray.clear(); // Clear existing values
          this.songData.progression.left.forEach((leftProg: string) => {
            leftProgressionsArray.push(
              this.fb.control(leftProg, Validators.required)
            );
          });

          const rightProgressionsArray = this.progressionForm.get(
            'rightProgressions'
          ) as FormArray;
          rightProgressionsArray.clear(); // Clear existing values
          this.songData.progression.right.forEach((rightProg: string) => {
            rightProgressionsArray.push(
              this.fb.control(rightProg, Validators.required)
            );
          });
        }
      }
    }
    this.cdr.markForCheck();
  }

  initializeForm() {
    this.progressionForm = this.fb.group({
      selectedKey: ['C', Validators.required],
      songName: ['', Validators.required],
      leftProgressions: this.fb.array([]),
      rightProgressions: this.fb.array([]),
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
      ...this.baseSolfegeMap.slice(0, keyIndex),
    ];

    // Clear and update dynamic solfege map
    this.dynamicSolfegeMap = {};
    rotatedNotes.forEach((note, index) => {
      this.dynamicSolfegeMap[note] = this.baseSolfegeNumbers[index];
    });

    // Manually update the form control value to reflect the change in UI
    this.progressionForm.patchValue({
      selectedKey: selectedKeyValue,
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
    if (
      this.bothSelected &&
      this.activeRowIndex !== null &&
      this.activeColumn !== null
    ) {
      if (this.activeColumn === 'left') {
        if (this.leftProgressions.length > this.activeRowIndex) {
          const leftRow = this.leftProgressions.at(
            this.activeRowIndex
          ) as FormControl;
          leftRow.setValue(
            leftRow.value ? `${leftRow.value}-${number}` : number
          );
        }
      } else if (this.activeColumn === 'right') {
        if (this.rightProgressions.length > this.activeRowIndex) {
          const rightRow = this.rightProgressions.at(
            this.activeRowIndex
          ) as FormControl;
          rightRow.setValue(
            rightRow.value ? `${rightRow.value}-${number}` : number
          );
        }
      }
    }

    // Handle for 'Left' selected
    else if (this.leftSelected &&  this.activeRowIndex !== null &&
      this.activeColumn !== null) {
      if (this.activeColumn === 'left') {
        if (this.leftProgressions.length > this.activeRowIndex) {
          const leftRow = this.leftProgressions.at(
            this.activeRowIndex
          ) as FormControl;
          leftRow.setValue(
            leftRow.value ? `${leftRow.value}, ${number}` : number
          );
        }
      }
    }

    // Handle for 'Right' selected
    else if (this.rightSelected &&  this.activeRowIndex !== null &&
      this.activeColumn !== null) {
      if (this.rightProgressions.length > this.activeRowIndex) {
        const rightRow = this.rightProgressions.at(
          this.activeRowIndex
        ) as FormControl;
        rightRow.setValue(
          rightRow.value ? `${rightRow.value}-${number}` : number
        );
      }
    }

    // Manually trigger change detection after pressing a key
    this.cdr.markForCheck();
  }

  selectLeft() {
    this.clearProgression(); // Avoid clearing existing data for simplicity
    this.leftSelected = true;
    this.rightSelected = false;
    this.bothSelected = false;
    if (this.leftProgressions.length === 0) {
      this.leftProgressions.push(this.fb.control('', Validators.required));
    }

    if (this.leftProgressions.length > 0) {
      this.activeRowIndex = 0; 
      this.activeColumn = 'left'; 
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

    
    if (this.rightProgressions.length > 0) {
      this.activeRowIndex = 0; 
      this.activeColumn = 'right'; 
    }
    this.cdr.markForCheck();
  }

  selectBoth() {
    this.clearProgression();
    this.leftSelected = false;
    this.rightSelected = false;
    this.bothSelected = true;
    if (
      this.leftProgressions.length === 0 &&
      this.rightProgressions.length === 0
    ) {
      this.leftProgressions.push(this.fb.control('', Validators.required));
      this.rightProgressions.push(this.fb.control('', Validators.required));
    }
    
    if (this.leftProgressions.length > 0) {
      this.activeRowIndex = 0; 
      this.activeColumn = 'left'; 
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
    } else {
      this.rightProgressions.push(leftControl);
      this.leftProgressions.push(rightControl);
    }
  }

  saveProgression() {
    const selectedKey = this.progressionForm.get('selectedKey')?.value; // Get selected key
    const songName =
      this.progressionForm.get('songName')?.value || 'Current progression'; // Default song name if not provided

    if (this.currentRoomId) {
      const progression = {
        left: this.leftProgressions.length ? this.leftProgressions.value : null,
        right: this.rightProgressions.length
          ? this.rightProgressions.value
          : null,
      };

      this.progression = progression;

      const roomRef = ref(this.db, `rooms/${this.currentRoomId}`); // Reference to the current room
      const songsRef = ref(this.db, `rooms/${this.currentRoomId}/songs/`); // Reference to the songs in the room

      // Check if the room exists
      get(roomRef)
        .then((roomSnapshot) => {
          if (roomSnapshot.exists()) {
            // If the room exists, check for the songs
            return get(songsRef);
          } else {
            throw new Error('Room does not exist.');
          }
        })
        .then((songsSnapshot) => {
          const songsData = songsSnapshot.val() || {}; // Get songs or set an empty object if none exists
          const songId = this.songData?.id || null; // Use the selectedSongId or generate a new one

          // If a song ID is provided and exists in the songs data, update the song
          if (songId && songsData[songId]) {
            const existingSongRef = ref(
              this.db,
              `rooms/${this.currentRoomId}/songs/${songId}`
            );
            const updatedSong = {
              id: songId,
              order: this.songData.order,
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
          this.toastService.showToast('Progression saved successfully!', 'success');
        })
        .catch((err) => {
          this.toastService.showToast('Error saving progression and song details!', 'error');

          console.error(
            'Error saving progression and song details:',
            err.message
          );
        });
    } else {
    
      this.toastService.showToast('Failed to save! No room ID found.', 'error');

    }


    this.leftSelected = false;
    this.rightSelected = false;
    this.bothSelected = false;
      // Clear the progression arrays
      this.leftProgressions.clear();
      this.rightProgressions.clear();
  
      // Reset the form while keeping the selected key and song name intact
      this.progressionForm.reset({
        selectedKey: 'C', 
        songName: '', 
        leftProgressions: [],
        rightProgressions: [], 
      });

      this.closePopup();
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
      rightProgressions: [], // Clear right progressions
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
    this.progressionConfirmed.emit(this.progression);
  }
}
