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
  providedIn: 'root',
})
export class RoomService {
  private roomIdKey = 'currentRoomId'; // Key for room ID in localStorage
  private roomNameKey = 'currentRoomName'; // Key for room name in localStorage

  // BehaviorSubject to store current room ID and name
  private currentRoomSubject = new BehaviorSubject<{
    id: string | null;
    name: string | null;
  } | null>(this.getRoomFromLocalStorage());
  currentRoom$ = this.currentRoomSubject.asObservable();
  currentRoomId: string | null = null;
  joinedRooms: Room[] = [];

  constructor(private db: Database, private auth: Auth) {
    // Initialize the room from local storage if present
    const storedRoom = this.getRoomFromLocalStorage();
    if (storedRoom) {
      this.currentRoomSubject.next(storedRoom);
    }
  }

  createRoom(roomName: string): Observable<void> {
    return new Observable((observer) => {
      const roomRef = push(ref(this.db, 'rooms')); // Create new room reference in Firebase
      this.currentRoomId = roomRef.key || ''; // Store the room ID

      const user = this.auth.currentUser; // Get current authenticated user
      if (!user) return;

      const userData = {
        uid: user?.uid,
        email: user?.email,
        admin: true, // Mark the user as admin
      };

      const roomData = {
        name: roomName,
        admin: user?.uid,
      };

      // Save the room with its name and add the user as the creator
      set(ref(this.db, `rooms/${this.currentRoomId}`), roomData)
        .then(() => {
          const userRoomsRef = ref(
            this.db,
            `users/${user?.uid}/rooms/${this.currentRoomId}`
          );
          // Store roomName under the user's rooms
          return set(userRoomsRef, { name: roomName });
        })
        .then(() => {
          // Add the user who created the room to the room's 'users' node
          const roomUsersRef = ref(
            this.db,
            `rooms/${this.currentRoomId}/users/${user?.uid}`
          );
          return set(roomUsersRef, userData);
        })
        .then(() => {
          observer.next(); // Emit success when everything is done
          observer.complete(); // Complete the observable
        })
        .catch((error) => {
          observer.error(error); // Emit error if something goes wrong
        });
    });
  }

  joinRoom(userData:any,roomId: string, roomName?: string): Observable<void> {
    return new Observable((observer) => {
   
  
      // Helper function to add the user to the room and user's room list
      const addUserToRoom = (roomName: string) => {
       
  
        const roomUsersRef = ref(this.db, `rooms/${roomId}/users/${userData.uid}`);
        const userRoomsRef = ref(this.db, `users/${userData.uid}/rooms/${roomId}`);

  
        set(roomUsersRef, userData)
          .then(() => set(userRoomsRef, { name: roomName })) // Add room to user's list of rooms
          .then(() => {
            console.log("users list")
            observer.next(); // Emit success when everything is done
            observer.complete(); // Complete the observable
          })
          .catch((error) => {
            console.log(error, "user list")
            observer.error(error)}); // Emit error if something goes wrong
      };
  
      // If roomName is not provided, fetch it from Firebase
      if (!roomName) {
        const roomRef = ref(this.db, `rooms/${roomId}/name`);
        get(roomRef)
          .then((snapshot) => {
            if (snapshot.exists()) {
              roomName = snapshot.val();
              addUserToRoom(roomName as string); // Proceed with adding the user
            } else {
              observer.error(new Error('Room name not found'));
            }
          })
          .catch((error) => observer.error(error)); // Emit error if fetching room name fails
      } else {
        addUserToRoom(roomName); // Proceed directly if roomName is already provided
      }
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
  public getRoomFromLocalStorage(): {
    id: string | null;
    name: string | null;
  } | null {
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
