import { Injectable } from '@angular/core';
import { Database, ref, set, onValue } from '@angular/fire/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PianoService {

  constructor(private db: Database) { }

  // Send the pressed key to Firebase
  sendKeyPress(note: string, sessionId: string) {
    return set(ref(this.db, `sessions/${sessionId}/pressedKey`), {
      note: note,
      timestamp: Date.now()
    });
  }

  // Listen for key presses in real-time
  getPressedKey(sessionId: string) {
    return new Observable(observer => {
      const keyRef = ref(this.db, `sessions/${sessionId}/pressedKey`);
      onValue(keyRef, (snapshot) => {
        observer.next(snapshot.val());
      });
    });
  }
}
