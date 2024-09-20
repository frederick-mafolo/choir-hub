import { Component, Output, EventEmitter, OnInit } from '@angular/core';

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
  styleUrls: ['./progression-editor.component.scss']
})
export class ProgressionEditorComponent implements OnInit {
  selectedKey: string = 'C';
  leftSelected: boolean = false;
  rightSelected: boolean = false;
  bothSelected: boolean = false;

  leftProgressions: string[][] = [];  // Array of arrays to store left hand progressions
  rightProgressions: string[][] = []; // Array of arrays to store right hand progressions

  leftInput: string[] = [];  // Current left hand progression row
  rightInput: string[] = []; // Current right hand progression row

  activeRowIndex: number | null = null; // Tracks the active row index when working with Both hands
  activeColumn: 'left' | 'right' | null = null; // Tracks which column is active in the "Both" case

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

  @Output() progressionConfirmed = new EventEmitter<string[]>();

  ngOnInit() {
    this.updateSolfegeMap();
  }

  updateSolfegeMap() {
    this.clearProgression();
    const keyIndex = this.baseSolfegeMap.indexOf(this.selectedKey);
    const rotatedNotes = [...this.baseSolfegeMap.slice(keyIndex), ...this.baseSolfegeMap.slice(0, keyIndex)];
    this.dynamicSolfegeMap = {};
    rotatedNotes.forEach((note, index) => {
      this.dynamicSolfegeMap[note] = this.baseSolfegeNumbers[index];
    });
  }

  pressKey(note: string) {
    const number = this.dynamicSolfegeMap[note];
    if (number) {
      if (this.bothSelected && this.activeRowIndex !== null && this.activeColumn !== null) {
        // Both: Enter the note in the active cell
        if (this.activeColumn === 'left') {
          this.leftProgressions[this.activeRowIndex][0] += (this.leftProgressions[this.activeRowIndex][0] ? '-' : '') + number;
        } else if (this.activeColumn === 'right') {
          this.rightProgressions[this.activeRowIndex][0] += (this.rightProgressions[this.activeRowIndex][0] ? '-' : '') + number;
        }
      } else if (this.leftSelected) {
        // Left: Add the note to the current row in the left progression
        this.leftInput.push(number);
      } else if (this.rightSelected) {
        // Right: Add the note to the current row in the right progression
        this.rightInput.push(number);
      }
    }
  }

  selectLeft() {
    this.clearProgression();
    this.leftSelected = true;
    this.rightSelected = false;
    this.bothSelected = false;
  }

  selectRight() {
    this.clearProgression();
    this.leftSelected = false;
    this.rightSelected = true;
    this.bothSelected = false;
  }

  selectBoth() {
    this.clearProgression();
    this.leftSelected = false;
    this.rightSelected = false;
    this.bothSelected = true;
    // Initialize with one empty row for both hands
    if (this.leftProgressions.length === 0) {
      this.leftProgressions.push(['']);
      this.rightProgressions.push(['']);
    }
  }

  closePopup() {
    this.progressionConfirmed.emit([]);  // Close without saving progressions
  }

  confirmProgression() {
    const flattenedLeft = this.leftProgressions.flat().join(', ');
    const flattenedRight = this.rightProgressions.flat().join(' - ');
    this.progressionConfirmed.emit([flattenedLeft, flattenedRight]);
  }

  clearProgression() {
    this.leftProgressions = [];
    this.rightProgressions = [];
    this.leftInput = [];
    this.rightInput = [];
  }

  onInputChange(event: any, index: number, isLeft: boolean) {
    const value = event.target.value;
    const formattedValue = isLeft
      ? value.split(',').map((v: string) => v.trim()) // Left: separate by commas
      : value.split('-').map((v: string) => v.trim()); // Right: separate by dashes

    if (isLeft) {
      this.leftProgressions[index] = formattedValue;
    } else {
      this.rightProgressions[index] = formattedValue;
    }
  }

  deleteRow(index: number, isLeft: boolean) {
    if (isLeft) {
      this.leftProgressions.splice(index, 1);
    } else {
      this.rightProgressions.splice(index, 1);
    }
  }

  deleteBothRow(index: number) {
    this.leftProgressions.splice(index, 1);
    this.rightProgressions.splice(index, 1);
  }

  addProgressionRow() {
    if (this.bothSelected) {
      // Both: Add a new row to both left and right hands
      this.leftProgressions.push(['']);
      this.rightProgressions.push(['']);
    } else if (this.leftSelected) {
      // Left: Save the current row and start a new row
      if (this.leftInput.length > 0) {
        this.leftProgressions.push([...this.leftInput]);
        this.leftInput = [];
      }
    } else if (this.rightSelected) {
      // Right: Save the current row and start a new row
      if (this.rightInput.length > 0) {
        this.rightProgressions.push([...this.rightInput]);
        this.rightInput = [];
      }
    }
  }

  setActiveCell(rowIndex: number, column: 'left' | 'right') {
    this.activeRowIndex = rowIndex;
    this.activeColumn = column;
  }
}
