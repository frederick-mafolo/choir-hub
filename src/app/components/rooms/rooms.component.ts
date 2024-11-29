import { Component, EventEmitter, Output,ChangeDetectorRef } from '@angular/core';
import { Database, get, push, ref, set } from '@angular/fire/database';
import { Auth } from '@angular/fire/auth';
import { RoomService } from 'src/app/services/room.service';
import { ToastService } from 'src/app/services/toast.service';
import { AuthService } from 'src/app/services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

  currentRoomId: string = '';
  joinedRooms: Room[] = [];
  roomForm: FormGroup;
  showRoomNameInput: boolean = false;
  showRoomIdInput: boolean = false;

  // Output event to emit the room ID to the parent component
  @Output() roomJoined = new EventEmitter<string>();
  @Output() roomConfirmed = new EventEmitter<string[]>();
  errorMessage: string | null = null;

  constructor(
    private db: Database,
    private auth: Auth,
    private authService: AuthService,
    private roomService: RoomService,
    private toastService: ToastService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.roomForm = this.fb.group({
      roomId: ['', [Validators.required, Validators.maxLength(50)]],
      roomName: ['', Validators.required, Validators.maxLength(50)],
    });
  }

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

  
    if (!this.roomForm.get('roomName')?.value) {
      this.toastService.showToast('Please enter a room name.', 'warning');
      return;
    }

    this.roomService.createRoom(this.roomForm.get('roomName')?.value).subscribe({
      next: (res) => {
        console.log(res)
        // Room created successfully
        this.roomJoined.emit(this.currentRoomId);
        this.closePopup();
        this.toastService.showToast(`Room "${this.roomForm.get('roomName')?.value}" created successfully`, 'success');
        this.roomForm.reset(); // Clear the room form
      },
      error: (error) => {
        // Handle any error
        this.roomForm.get('roomName')?.setErrors({ 'createRoomError': true });

        if(error)
        this.errorMessage = error;
        else
        this.errorMessage = 'Error creating room';

        this.cdr.detectChanges(); 
        this.toastService.showToast('Error creating room', 'error');
      
      }
    });
  
   
  }
  

  joinRoom() { 

    if(this.showRoomIdInput === false){
      this.toggleJoinRoom();
      return
    }

    if (!this.roomForm.get('roomId')?.value) {
      this.toastService.showToast('Please enter a room ID.', 'warning');
      return;
    }

    this.selectAndJoinRoom(this.roomForm.get('roomId')?.value, this.roomForm.get('roomName')?.value)

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
      displayName: user.displayName
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
        this.roomForm.get('roomId')?.setErrors({ 'joinRoomError': true });

        if(error)
        this.errorMessage = error;
        else
        this.errorMessage = 'Error joining room';

        this.cdr.detectChanges(); 

      }
    });
   
  }
  
  closePopup() {
    this.roomConfirmed.emit([]);
  }
}
