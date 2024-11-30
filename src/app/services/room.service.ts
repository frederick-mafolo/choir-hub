import { Injectable } from '@angular/core';
import { Database, get, push, ref, remove, set, update } from '@angular/fire/database';
import { Auth } from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';
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
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        admin: true, // Mark the user as admin
      };
  
      const roomData = {
        name: roomName,
        admins: {
          [user.uid]: true, // Initialize admins node with the creator
        },
      };
  
      // Save the room with its name and add the user as the creator
      set(ref(this.db, `rooms/${this.currentRoomId}`), roomData)
        .then(() => {
          const userRoomsRef = ref(
            this.db,
            `users/${user.uid}/rooms/${this.currentRoomId}`
          );
          // Store roomName under the user's rooms
          return set(userRoomsRef, true);
        })
        .then(() => {
          // Add the user who created the room to the room's 'users' node
          const roomUsersRef = ref(
            this.db,
            `rooms/${this.currentRoomId}/users/${user.uid}`
          );
          return set(roomUsersRef, userData);
        })
        .then(() => {
         
          if(this.currentRoomId && this.currentRoomId){
            console.log(this.currentRoomId)
          this.setCurrentRoom(this.currentRoomId as string, roomName as string);
          }

          observer.next(); // Emit success when everything is done
          observer.complete(); // Complete the observable
        })

        .catch((error) => {
          observer.error(error); // Emit error if something goes wrong
        });
    });
  }
  
  saveUserData(userData:any): Observable<void>{
    return new Observable((observer) => {
      // Save the user data to the 'users' node in Firebase Database or Firestore
      const userRef = ref(this.db, `users/${userData.uid}`);
      update(userRef, {email : userData.email, displayName : userData.displayName})
        .then(() => {
     
          observer.next(); // Emit success when everything is done
          observer.complete(); // Complete the observable
        
        })
        .catch((dbError) => {
          observer.error(dbError); // Emit error if something goes wrong
        });
      })
  }

  joinRoom(userData: any, roomId: string, roomName?: string): Observable<void> {
    return new Observable((observer) => {
  
      // Reference for blocked emails
      const sanitizedEmail = userData.email.replace(/\./g, ',');
      const blockedEmailRef = ref(this.db, `rooms/${roomId}/blockedEmails/${sanitizedEmail}`);
      
      // Check if user's email is blocked
      get(blockedEmailRef).then((snapshot) => {
        if (snapshot.exists()) {
          observer.error(new Error(`User with email ${userData.email} is blocked from this room.`));
          return;
        }
  
        // Helper function to add the user to the room and user's room list
        const addUserToRoom = (roomName: string) => {
          const roomUsersRef = ref(this.db, `rooms/${roomId}/users/${userData.uid}`);
          const userRoomsRef = ref(this.db, `users/${userData.uid}/rooms/${roomId}`);
  
          set(roomUsersRef, userData)
            .then(() => set(userRoomsRef, true)) // Add room to user's list of rooms
            .then(() => {
              this.setCurrentRoom(roomId, roomName as string);
              this.setActivityLog('joined the room', userData, roomId).subscribe({
                next: () => console.log('Join activity logged.'),
                error: (err) => console.error('Failed to log join activity:', err),
              });
              observer.next(); // Emit success when everything is done
              observer.complete(); // Complete the observable
            })
            .catch((error) => {
              observer.error(error); // Emit error if something goes wrong
            });
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
      }).catch((error) => observer.error(error));
    });
  }

  saveLineNote(roomId: string, note: string): Promise<void> {
    const lineNoteRef = ref(this.db, `rooms/${roomId}/lineNote`);
    return set(lineNoteRef, note);
  }


  exitRoom(userData:any, roomId: string): Observable<void>{
   return new Observable((observer) =>{

    this.setActivityLog('left the room', userData, roomId).subscribe({
      next: () =>{
        const userRoomsRef = ref(this.db, `users/${userData.uid}/rooms/${roomId}`);
        remove(userRoomsRef)
         .then(() => {
           const userRef = ref(
             this.db,
             `rooms/${roomId}/users/${userData.uid}`
           );
            remove(userRef)
             .then(async () => {
               
               observer.next(); // Emit success when everything is done
               observer.complete(); // Complete the observable
         }).catch((error) => {
           observer.error(error)
         });
         }).catch((error) => {
           observer.error(error)
         });
      },
      error: (err) => console.error('Failed to log join activity:', err),
    });
   })
  
  }

  setActivityLog(activity: string, userData: any, roomId: string): Observable<void> {
    return new Observable((observer) => {
      const timestamp = Date.now();
      const logEntry = {
        type: activity, // join or leave
        userId: userData.uid,
        displayName: userData.displayName || userData.email,
        email:userData.email,
        roomId: roomId,
        timestamp: timestamp,
      };
  
      const activityLogRef = ref(this.db, `rooms/${roomId}/activityLogs`);
      push(activityLogRef, logEntry)
        .then(() => {
          observer.next(); // Log entry added successfully
          observer.complete();
        })
        .catch((error) => {
          observer.error(error); // Handle errors
        });
    });
  }

  getActivityLog(roomId: string): Observable<any[]> {
    const activityLogRef = ref(this.db, `rooms/${roomId}/activityLogs`);
    return new Observable((observer) => {
      get(activityLogRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const logs = Object.values(snapshot.val());
            observer.next(logs);
          } else {
            observer.next([]);
          }
          observer.complete();
        })
        .catch((error) => observer.error(error));
    });
  }
  
  deleteAllActivityLogs(roomId: string): Observable<void> {
    return new Observable((observer) => {
    const activityLogsRef = ref(this.db, `rooms/${roomId}/activityLogs`);
     remove(activityLogsRef)
      .then(() => {
        observer.next(); 
        observer.complete();
      })
      .catch((error) => {
        observer.error(error)
      });
    })
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
