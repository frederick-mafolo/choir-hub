import { Component ,EventEmitter, Output } from '@angular/core';
import { Database, get, onValue, push, ref, set } from '@angular/fire/database';
import { Auth } from '@angular/fire/auth';
import { AuthService } from 'src/app/services/auth.service';
import { RoomService } from 'src/app/services/room.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-rooms',
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.scss',
})
export class RoomsComponent {
  roomId: string = '';
  currentRoomId: string = '';
  joinedRooms: string[] = [];
  userId: string | null = null;
    // Output event to emit the room ID to the parent component
  @Output() roomJoined = new EventEmitter<string>();

  @Output() roomConfirmed = new EventEmitter<string[]>();
  constructor(private db: Database, private auth: Auth,private authService: AuthService,private roomService: RoomService,  private toastService: ToastService,) {}

  ngOnInit(): void {
    // Check if the user is logged in and set the userId from localStorage

    this.roomService.currentRoom$.subscribe((roomId) => {
      this.currentRoomId = roomId || ''; 
    })
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.userId = user.uid;
        this.loadJoinedRooms();
      } else {
        // Optionally, check if user data exists in localStorage
        const storedUser = this.authService.getUserData();
        if (storedUser) {
          this.userId = storedUser.uid;
          this.loadJoinedRooms();
        }
      }
    });
  }
  async loadJoinedRooms() {
    try {
      const userRoomsRef = ref(this.db, `users/${this.userId}/rooms`);
      const snapshot = await get(userRoomsRef);
  
      const rooms = snapshot.val();
      if (rooms) {
        this.joinedRooms = Object.keys(rooms);
      } else {
        this.joinedRooms = [];
        this.toastService.showToast('No rooms found.', 'warning');

      }
    } catch (error) {
     
      this.toastService.showToast('Error loading joined rooms', 'error');

      // You can show a message to the user or retry logic here
    }
  }
  
  

  createRoom() {
    const roomRef = push(ref(this.db, 'rooms')); // Create a new room in Firebase
    this.currentRoomId = roomRef.key || '';
    this.roomJoined.emit(this.currentRoomId);
    // Add the new room to the user's list of rooms in Firebase
    const userRoomsRef = ref(
      this.db,
      `users/${this.userId}/rooms/${this.currentRoomId}`
    );
    set(userRoomsRef, true)
      .then(() => {
        this.toastService.showToast(`Room created and added to user's room list: ${this.currentRoomId}`, 'success');
      })
      .catch((error) => {
        this.toastService.showToast('Error adding room to user list', 'error');
      });
  }

  joinRoom(roomId: string) {

    if (roomId) {
    
      this.currentRoomId = roomId;

      this.roomJoined.emit(roomId)
     
      // Add the room to the user's list of rooms in Firebase
      const userRoomsRef = ref(
        this.db,
        `users/${this.userId}/rooms/${this.currentRoomId}`
      );
      set(userRoomsRef, true)
        .then(() => {
          this.roomService.setCurrentRoom(this.currentRoomId);
          this.closePopup();
          this.toastService.showToast(`Joined room ${this.currentRoomId}`, 'success');
        })
        .catch((error) => {
        
          this.toastService.showToast('Error joining room', 'error');

        });
    } else {
      this.toastService.showToast('Please enter a room ID.', 'warning');

    }
  
  }

  leaveRoom() {
    this.roomService.clearCurrentRoom();
    this.toastService.showToast('Left the room:', 'success');

  }
  
  
  closePopup() {
    // Emit an event or handle closing logic
    
    this.roomConfirmed.emit([]);
  }

}
