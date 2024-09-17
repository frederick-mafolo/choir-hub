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

  leftProgression: string[] = [];
  rightProgression: string[] = [];
  leftInput: string = '';  // Stores left hand progression as a string
  rightInput: string = ''; // Stores right hand progression as a string

  activeRowIndex: number | null = null; // Active row index for Both
  activeColumn: 'left' | 'right' | null = null; // Tracks which cell (left or right) is active

  keys: KeyGroup[] = [
    { white: { note: 'C', active: false }, black: { note: 'C#', active: false } },
    { white: { note: 'D', active: false }, black: { note: 'Eb', active: false } },
    { white: { note: 'E', active: false } },
    { white: { note: 'F', active: false }, black: { note: 'F#', active: false } },
    { white: { note: 'G', active: false }, black: { note: 'Ab', active: false } },
    { white: { note: 'A', active: false }, black: { note: 'Bb', active: false } },
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
    this.leftProgression = [];
    this.rightProgression = [];
    const keyIndex = this.baseSolfegeMap.indexOf(this.selectedKey);
    const rotatedNotes = [...this.baseSolfegeMap.slice(keyIndex), ...this.baseSolfegeMap.slice(0, keyIndex)];
    this.dynamicSolfegeMap = {};
    rotatedNotes.forEach((note, index) => {
      this.dynamicSolfegeMap[note] = this.baseSolfegeNumbers[index];
    });
  }

  pressKey(note: string) {
    const number = this.dynamicSolfegeMap[note];
    if (number && this.bothSelected && this.activeRowIndex !== null && this.activeColumn !== null) {
      // Enter the note in the active cell (either left or right) without adding rows
      if (this.activeColumn === 'left') {
        this.leftProgression[this.activeRowIndex] += (this.leftProgression[this.activeRowIndex] ? '- ' : '') + number;
      } else if (this.activeColumn === 'right') {
        this.rightProgression[this.activeRowIndex] += (this.rightProgression[this.activeRowIndex] ? '- ' : '') + number;
      }
    } else if (this.leftSelected) {
      // Add the note to the left input as a comma-separated progression
      this.leftInput += (this.leftInput ? ', ' : '') + number;
    } else if (this.rightSelected) {
      // Add the note to the right input as a comma-separated progression
      this.rightInput += (this.rightInput ? ', ' : '') + number;
    }
  }

  addProgressionRow() {
    this.leftProgression.push('');
    this.rightProgression.push('');
  }

  setActiveCell(rowIndex: number, column: 'left' | 'right') {
    this.activeRowIndex = rowIndex;
    this.activeColumn = column;
  }

  selectLeft() {
    this.leftSelected = true;
    this.rightSelected = false;
    this.bothSelected = false;
  }

  selectRight() {
    this.leftSelected = false;
    this.rightSelected = true;
    this.bothSelected = false;
  }

  selectBoth() {
    this.leftSelected = false;
    this.rightSelected = false;
    this.bothSelected = true;
    this.addProgressionRow();  // Automatically add one row when "Both" is selected
  }

  closePopup() {
    this.progressionConfirmed.emit([]);
  }

  confirmProgression() {
    this.progressionConfirmed.emit([...this.leftProgression, ...this.rightProgression]);
  }

  clearProgression() {
    this.leftProgression = [];
    this.rightProgression = [];
    this.leftInput = '';
    this.rightInput = '';
    this.activeRowIndex = null;
    this.activeColumn = null;
  }
}
