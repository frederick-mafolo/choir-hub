import { Component, ViewChild, ElementRef } from '@angular/core';
import { PianoService } from '../services/piano.service';

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
  styleUrls: ['./piano.component.scss']
})
export class PianoComponent {
  @ViewChild('audioPlayer') audioPlayerRef!: ElementRef;
  sessionId: string = ''; // Session ID for different groups
  pressedKey: string | null = null; // Currently pressed key

  keys: KeyGroup[] = [
    { white: { note: 'C', active: false }, black: { note: 'C#', active: false } },
    { white: { note: 'D', active: false }, black: { note: 'Eb', active: false } },
    { white: { note: 'E', active: false } },
    { white: { note: 'F', active: false }, black: { note: 'F#', active: false } },
    { white: { note: 'G', active: false }, black: { note: 'Ab', active: false } },
    { white: { note: 'A', active: false }, black: { note: 'Bb', active: false } },
    { white: { note: 'B', active: false } }
  ];

  constructor(private pianoService: PianoService) {}

  // Join a session and listen for keypress events
  joinSession() {
    if (this.sessionId) {
      this.pianoService.getPressedKey(this.sessionId).subscribe((data:any) => {
        if (data && data.note) {
          this.pressedKey = data.note;
          this.playSound(data.note, false); // Play sound but don't broadcast again
        }
      });
    }
  }

  playSound(note: string, broadcast: boolean = true) {
    const audioPlayer = this.audioPlayerRef.nativeElement as HTMLAudioElement;
    audioPlayer.src = `assets/sounds/${note}.mp3`;
    audioPlayer.load();
    audioPlayer.play();

    this.pressedKey = note;

    // If broadcast is true, send the key press to Firebase
    if (broadcast && this.sessionId) {
      this.pianoService.sendKeyPress(note, this.sessionId);
    }

    // Highlight the pressed key
    this.keys.forEach(group => {
      if (group.white.note === note) {
        group.white.active = true;
        setTimeout(() => group.white.active = false, 300);
      } else if (group.black && group.black.note === note) {
        group.black.active = true;
        setTimeout(() => group.black!.active = false, 300);
      }
    });
  }  
}
