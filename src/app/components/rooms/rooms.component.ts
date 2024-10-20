import { Component, EventEmitter, Output } from '@angular/core';
import { Database, get, push, ref, set } from '@angular/fire/database';
import { Auth } from '@angular/fire/auth';
import { RoomService } from 'src/app/services/room.service';
import { ToastService } from 'src/app/services/toast.service';

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
  userId: string | null = null;
  
  showRoomNameInput: boolean = false;
  showRoomIdInput: boolean = false;

  // Output event to emit the room ID to the parent component
  @Output() roomJoined = new EventEmitter<string>();
  @Output() roomConfirmed = new EventEmitter<string[]>();

  constructor(
    private db: Database,
    private auth: Auth,
    private roomService: RoomService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.userId = user.uid;
        this.loadJoinedRooms();
      }
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


  async loadJoinedRooms() {
    try {
      const userRoomsRef = ref(this.db, `users/${this.userId}/rooms`);
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
    this.roomJoined.emit(roomId);
  
    const user = this.auth.currentUser; // Assume user is authenticated and has user details
    const userData = {
      uid: user?.uid,
      email: user?.email,
    };

          // If the roomName is not provided, retrieve it from Firebase
  if (!roomName) {
    const roomRef = ref(this.db, `rooms/${roomId}/name`);
    get(roomRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          roomName = snapshot.val();  // Assign the retrieved room name
        } else {
          this.toastService.showToast('Room name not found.', 'error');
        }
      })
      .catch(() => {
        this.toastService.showToast('Error retrieving room name.', 'error');
      });
  } 
  
  console.log(roomName)
    // Add user details under room's 'users' node in Firebase
    const roomUsersRef = ref(this.db, `rooms/${roomId}/users/${user?.uid}`);

    set(roomUsersRef, userData)
      .then(() => {
        const userRoomsRef = ref(this.db, `users/${this.userId}/rooms/${roomId}`);
        return set(userRoomsRef, true); // Add room to user's list of rooms
      })
      .then(() => {
        this.roomService.setCurrentRoom(roomId, roomName);
        this.closePopup();
        this.toastService.showToast(`Joined room ${roomName}`, 'success');
      })
      .catch(() => {
        this.toastService.showToast('Error joining room', 'error');
      });
  }
  
  closePopup() {
    this.roomConfirmed.emit([]);
  }
}
