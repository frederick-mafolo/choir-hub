import { Component, EventEmitter, Output } from '@angular/core';
import { Database, get, push, ref, set } from '@angular/fire/database';
import { Auth } from '@angular/fire/auth';
import { RoomService } from 'src/app/services/room.service';
import { ToastService } from 'src/app/services/toast.service';
import { AuthService } from 'src/app/services/auth.service';

interface Room {
  id: string;
  name: string;
}

@Component({
  selector: 'app-rooms',
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss'],
})
export class RoomsComponent {
  roomId: string = '';
  roomName: string = ''; // Room Name input field
  currentRoomId: string = '';
  joinedRooms: Room[] = [];
  
  
  showRoomNameInput: boolean = false;
  showRoomIdInput: boolean = false;

  // Output event to emit the room ID to the parent component
  @Output() roomJoined = new EventEmitter<string>();
  @Output() roomConfirmed = new EventEmitter<string[]>();

  constructor(
    private db: Database,
    private auth: Auth,
    private authService: AuthService,
    private roomService: RoomService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.authService.getUserData().subscribe((data) => {
      this.loadJoinedRooms( data.uid);
    });
       

  }

  // Method to toggle the 'Join Room' input field
  toggleJoinRoom() {
    this.showRoomIdInput = true;
    this.showRoomNameInput = false;
  }

  // Method to toggle the 'Create Room' input field
  toggleCreateRoom() {
    this.showRoomNameInput = true;
    this.showRoomIdInput = false;
  }


  async loadJoinedRooms(userId:string) {
    try {
      const userRoomsRef = ref(this.db, `users/${userId}/rooms`);
      const snapshot = await get(userRoomsRef);
  
      const rooms = snapshot.val();
  
      // Check if rooms exist
      if (rooms) {
        // Fetch room names from the rooms node
        this.joinedRooms = await Promise.all(Object.keys(rooms).map(async (roomId) => {
          const roomNameSnapshot = await get(ref(this.db, `rooms/${roomId}/name`));
          const roomName = roomNameSnapshot.exists() ? roomNameSnapshot.val() : ''; // Default to roomId if no name
          return { id: roomId, name: roomName  };
        }));
      } else {
        this.joinedRooms = [];
      }
    } catch (error) {
      this.toastService.showToast('Error loading joined rooms', 'error');
    }
  }
  
  

  createRoom() {
    if (this.showRoomNameInput === false) {
      this.toggleCreateRoom();
      return;
    }
  
    if (!this.roomName) {
      this.toastService.showToast('Please enter a room name.', 'warning');
      return;
    }

    this.roomService.createRoom(this.roomName).subscribe({
      next: () => {
        // Room created successfully
        this.roomJoined.emit(this.currentRoomId);
        this.roomName = ''; // Clear the room name input
        this.toastService.showToast(`Room "${this.roomName}" created successfully`, 'success');
      },
      error: (error) => {
        // Handle any error
        this.toastService.showToast('Error creating room', 'error');
        console.error('Room creation failed', error);
      }
    });
  
   
  }
  

  joinRoom(roomId: string,roomName: string) {

    if(this.showRoomIdInput === false){
      this.toggleJoinRoom();
      return
    }

    if (!roomId) {
      this.toastService.showToast('Please enter a room ID.', 'warning');
      return;
    }

    this.selectAndJoinRoom(roomId,roomName)

  }

  selectAndJoinRoom(roomId: string, roomName: string) {
    this.currentRoomId = roomId;
 

    const user = this.auth.currentUser; // Get current authenticated user
    if (!user) {
      this.toastService.showToast('User not authenticated', 'error');
      return;
    }
    
    const userData = {
      uid: user.uid,
      email: user.email,
    };

    this.roomService.joinRoom(userData,roomId, roomName).subscribe({
      next: () => {
        // Room created successfully
        this.roomJoined.emit(roomId);
    
        this.closePopup();
        this.toastService.showToast(`Joined room ${roomName}`, 'success');
      },
      error: (error) => {
        // Handle any error
        this.toastService.showToast('Error joining room', 'error');
        console.error('Room creation failed', error);
      }
    });
   
  }
  
  closePopup() {
    this.roomConfirmed.emit([]);
  }
}
