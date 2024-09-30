import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private roomIdKey = 'currentRoomId'; // Key for localStorage
  private currentRoomSubject = new BehaviorSubject<string | null>(this.getRoomFromLocalStorage());
  currentRoom$ = this.currentRoomSubject.asObservable();

  constructor() {
    // Initialize the room ID from local storage
    const storedRoomId = this.getRoomFromLocalStorage();
    if (storedRoomId) {
      this.currentRoomSubject.next(storedRoomId);
    }
  }

  // Set the current room and save it to local storage
  setCurrentRoom(roomId: string) {
    this.currentRoomSubject.next(roomId);
    localStorage.setItem(this.roomIdKey, roomId); // Persist the room ID in local storage
  }

  // Clear the current room 
  clearCurrentRoom() {
    this.currentRoomSubject.next(null);
    localStorage.removeItem(this.roomIdKey); // Remove the room ID from local storage
  }

  // Get the room ID from local storage
  public getRoomFromLocalStorage(): string | null {
    return localStorage.getItem(this.roomIdKey);
  }
}
