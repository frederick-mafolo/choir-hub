import { Injectable } from '@angular/core';
import { Database, get, push, ref, set } from '@angular/fire/database';
import { ToastService } from './toast.service';
import { Auth } from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { from } from 'rxjs';
interface Room {
  id: string;
  name: string;
}
@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private roomIdKey = 'currentRoomId'; // Key for room ID in localStorage
  private roomNameKey = 'currentRoomName'; // Key for room name in localStorage

  // BehaviorSubject to store current room ID and name
  private currentRoomSubject = new BehaviorSubject<{id: string | null, name: string | null} | null>(this.getRoomFromLocalStorage());
  currentRoom$ = this.currentRoomSubject.asObservable();
  currentRoomId: string | null = null;
  joinedRooms: Room[] = [];

  constructor(
    private db: Database,
    private auth: Auth
  ) {
    // Initialize the room from local storage if present
    const storedRoom = this.getRoomFromLocalStorage();
    if (storedRoom) {
      this.currentRoomSubject.next(storedRoom);
    }
  }

  createRoom(roomName: string): Observable<void> {
    return new Observable((observer) => {
      const roomRef = push(ref(this.db, 'rooms'));
      this.currentRoomId = roomRef.key || '';

      const user = this.auth.currentUser;
      const userData = {
        uid: user?.uid,
        email: user?.email,
        admin: true,
      };

      const roomData = {
        name: roomName,
        admin: user?.uid,
      };

      // Save the room with its name and add the user as the creator
      set(ref(this.db, `rooms/${this.currentRoomId}`), roomData)
        .then(() => {
          const userRoomsRef = ref(this.db, `users/${user?.uid}/rooms/${this.currentRoomId}`);
          return set(userRoomsRef, true);
        })
        .then(() => {
          // Add the user who created the room to the room's 'users' node
          const roomUsersRef = ref(this.db, `rooms/${this.currentRoomId}/users/${user?.uid}`);
          return set(roomUsersRef, userData);
        })
        .then(() => {
          observer.next(); // Emit success
          observer.complete(); // Complete the observable
        })
        .catch((error) => {
          observer.error(error); // Emit error if something goes wrong
        });
    });
  }

  // Set the current room (ID and name) and save it to local storage
  setCurrentRoom(roomId: string, roomName: string) {
    const roomData = { id: roomId, name: roomName };
    this.currentRoomSubject.next(roomData);

    // Persist the room ID and name in localStorage
    localStorage.setItem(this.roomIdKey, roomId);
    localStorage.setItem(this.roomNameKey, roomName);
  }

  // Clear the current room 
  clearCurrentRoom() {
    this.currentRoomSubject.next(null);

    // Remove the room ID and name from local storage
    localStorage.removeItem(this.roomIdKey);
    localStorage.removeItem(this.roomNameKey);
  }

  // Get the room (ID and name) from local storage
  public getRoomFromLocalStorage(): { id: string | null, name: string | null } | null {
    const roomId = localStorage.getItem(this.roomIdKey);
    const roomName = localStorage.getItem(this.roomNameKey);

    if (roomId && roomName) {
      return { id: roomId, name: roomName };
    } 
    return null;
  }

  // Get only the room name from local storage
  public getRoomNameFromLocalStorage(): string | null {
    return localStorage.getItem(this.roomNameKey);
  }
}
