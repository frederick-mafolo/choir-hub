import { Component, OnInit } from '@angular/core';
import {
  Database,
  ref,
  get,
  push,
  update,
  set,
  remove,
} from '@angular/fire/database';
import { ToastService } from 'src/app/services/toast.service';
import { DeleteConfirmationModalComponent } from '../delete-confirmation-modal/delete-confirmation-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { CreateNewRoomComponent } from '../create-new-room/create-new-room.component';
import { Auth, user } from '@angular/fire/auth';
import { AuthService } from 'src/app/services/auth.service';
import { RoomService } from 'src/app/services/room.service';

@Component({
  selector: 'app-manage-rooms',
  templateUrl: './manage-rooms.component.html',
  styleUrls: ['./manage-rooms.component.scss'],
})
export class ManageRoomsComponent implements OnInit {
  rooms: Array<{ id: string; name: string; admin?: string }> = [];
  selectedRoom: {
    id: string;
    name: string;
    admin?: string;
    users: Array<{ id: string; name: string; email: string ; admin?:boolean}>;
  } | null = null;
  newRoomName: string = '';
  userData!: {
    uid: string;
    email: string;
    name: string;
  };

  isAdmin:boolean = false;
  constructor(
    private db: Database,
    private auth: Auth,
    private authService: AuthService,
    private toastService: ToastService,
    private roomService: RoomService,
    private dialog: MatDialog
  ) {
    this.userData = this.authService.getUserData();
  }

  ngOnInit(): void {
    this.loadRooms();
  }

  // Load rooms with their names

  async loadRooms() {
    try {
      const userRoomsRef = ref(this.db, `users/${this.userData?.uid}/rooms`);
      const snapshot = await get(userRoomsRef);

      const rooms = snapshot.val();

      // Check if rooms exist
      if (rooms) {
        // Fetch room names from the rooms node
        this.rooms = await Promise.all(
          Object.keys(rooms).map(async (roomId) => {
            const roomNameSnapshot = await get(
              ref(this.db, `rooms/${roomId}/name`)
            );
            const roomName = roomNameSnapshot.exists()
              ? roomNameSnapshot.val()
              : roomId; // Default to roomId if no name
            return { id: roomId, name: roomName };
          })
        );
      } else {
        this.rooms = [];
      }
    } catch (error) {
      console.error(error);
      this.toastService.showToast('Error loading joined rooms', 'error');
    }
  }

  openCreateRoomDialog(): void {
    const dialogRef = this.dialog.open(CreateNewRoomComponent);

    dialogRef.afterClosed().subscribe((roomName) => {
      if (roomName) {
        this.roomService.createRoom(roomName).subscribe({
          next: () => {
            this.toastService.showToast(
              `Room "${roomName}" created successfully`,
              'success'
            );

            this.loadRooms();
          },
          error: (error: any) => {
            // Handle any error
            this.toastService.showToast('Error creating room', 'error');
            console.error('Room creation failed', error);
          },
        });
      }
    });
  }

  getUsernameFromEmail(email: string): string {
    if (!email) return ''; // Handle cases where email is empty or null
    const username = email.split('@')[0]; // Get the part before '@'
    return username.replace(/\./g, ' '); // Replace dots with spaces
  }

  // Select a room to view users
  async selectRoom(room: { id: string; name: string; admin?: string }) {
    this.selectedRoom = { ...room, users: [] };

    const roomSnapshot = await get(ref(this.db, `rooms/${room.id}`));
    const roomData = roomSnapshot.exists() ? roomSnapshot.val() : null;

    if (roomData) {
      this.isAdmin = roomData.admin === this.userData?.uid;
      this.selectedRoom.admin = roomData.admin;
    }
    const roomUsersRef = ref(this.db, `rooms/${room.id}/users`);
    const usersSnapshot = await get(roomUsersRef);
    const users = usersSnapshot.val();
    this.newRoomName = this.selectedRoom.name;
    if (users) {
      this.selectedRoom.users = Object.keys(users).map((userId) => ({
        id: userId,
        name:
          users[userId].name || this.getUsernameFromEmail(users[userId].email),
        email: users[userId].email,
        admin: users[userId].admin,
      }));
    }
  }

  // Edit the name of the selected room
  async editRoomName() {
    if (this.selectedRoom && this.newRoomName.trim()) {

   
        const currentUser = this.auth.currentUser;
      
        // Check if the current user is allowed to remove others
        if (currentUser?.uid !== this.selectedRoom.admin) {
          this.toastService.showToast('Only the admin can remove users!', 'error');
          return;
        }
 
      const roomRef = ref(this.db, `rooms/${this.selectedRoom.id}`);
      await update(roomRef, { name: this.newRoomName })
        .then(() => {})
        .catch(() => {
          this.toastService.showToast('Error editing name', 'error');
        });
      this.toastService.showToast('Room name updated!', 'success');
      this.selectedRoom.name = this.newRoomName;
      this.loadRooms(); // Reload rooms to update name
    }
  }

  // Delete a room
  deleteRoom(roomId: string, roomName: string) {
    const data = {
      message: roomName,
    };

    if (this.selectedRoom) {
    const currentUser = this.auth.currentUser;
  
    // Check if the current user is allowed to remove others
    if (currentUser?.uid !== this.selectedRoom.admin) {
      this.toastService.showToast('Only the admin can remove users!', 'error');
      return;
    }
  }
    const dialogRef = this.dialog.open(DeleteConfirmationModalComponent, {
      width: '250px',
      data: { ...data },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        // First remove the room from the user's room list
        const userRoomRef = ref(
          this.db,
          `users/${this.userData?.uid}/rooms/${roomId}`
        );
        remove(userRoomRef)
          .then(() => {
            // After successfully removing the room from the user's list, remove the room from Firebase
            const roomRef = ref(this.db, `rooms/${roomId}`);
            return remove(roomRef);
          })
          .then(() => {
            this.toastService.showToast('Room deleted!', 'success');
            this.loadRooms(); // Refresh the room list after deletion
            this.selectedRoom = null; // Clear the selected room
          })
          .catch((error) => {
            this.toastService.showToast(
              'Error deleting room: ' + error.message,
              'error'
            );
          });
      }
    });
  }

  copyRoomId(roomId: string) {
    if (roomId) {
      navigator.clipboard.writeText(roomId).then(
        () => {
          this.toastService.showToast(
            'Room ID copied to clipboard!',
            'success'
          );
        },
        (err) => {
          this.toastService.showToast('Failed to copy Room ID', 'error');
        }
      );
    }
  }

  // Remove a user from a room
  async removeUser(userId: string) {
    if (this.selectedRoom) {
      const currentUser = this.auth.currentUser;
  
      // Check if the current user is allowed to remove others
      console.log(currentUser?.uid ,this.selectedRoom.admin)
      if (currentUser?.uid !== this.selectedRoom.admin && userId !== currentUser?.uid) {
        this.toastService.showToast('Only the admin can remove users!', 'error');
        return;
      }
  
      const userRef = ref(this.db, `rooms/${this.selectedRoom.id}/users/${userId}`);
      
      await remove(userRef)
        .then(async () => {
          const roomUsersRef = ref(this.db, `rooms/${this.selectedRoom?.id}/users`);
          const roomAdminRef = ref(this.db, `rooms/${this.selectedRoom?.id}/admin`);
  
          // Fetch remaining users in the room
          const usersSnapshot = await get(roomUsersRef);
          const remainingUsers = usersSnapshot.val();
  
          // If user was the admin and there are still users, assign a new admin
          if (userId === this.selectedRoom?.admin && remainingUsers) {
            const remainingUserIds = Object.keys(remainingUsers);
            if (remainingUserIds.length > 0) {
              const newAdminId =
                remainingUserIds[
                  Math.floor(Math.random() * remainingUserIds.length)
                ];
              // Set the new admin
              await set(roomAdminRef, newAdminId);
               // Add "admin: true" property to the new admin's user data
            const newAdminUserRef = ref(this.db, `rooms/${this.selectedRoom.id}/users/${newAdminId}`);
            await set(newAdminUserRef, {
              ...remainingUsers[newAdminId],
              admin: true
            });

            this.loadRooms();
              this.toastService.showToast(
                `New admin is now ${remainingUsers[newAdminId].email}`,
                'success'
              );
            }
          }
  
          // If no users remain, delete the room
          if (!remainingUsers) {
            const roomRef = ref(this.db, `rooms/${this.selectedRoom?.id}`);
            await remove(roomRef);
            this.toastService.showToast(
              'Room deleted as no users remain!',
              'success'
            );
          }
  
          // Also remove the room under the user's rooms list
          const userRoomsRef = ref(this.db, `users/${userId}/rooms/${this.selectedRoom?.id}`);
          await remove(userRoomsRef);
          this.toastService.showToast('User removed from room!', 'success');
        })
        .catch((error) => {
          this.toastService.showToast('Failed to remove the user', 'error');
        });
  
      this.selectRoom(this.selectedRoom); // Reload users
    }
  }
  

  exitRoom(roomId: string) {
    const user = this.auth.currentUser; // Get the current user

    if (user) {
      // Remove the user from the room's users list
      const roomUsersRef = ref(this.db, `rooms/${roomId}/users/${user.uid}`);
      remove(roomUsersRef)
        .then(() => {
          // Remove the room from the user's list of rooms
          const userRoomsRef = ref(
            this.db,
            `users/${user.uid}/rooms/${roomId}`
          );
          return remove(userRoomsRef);
        })
        .then(() => {
          // this.toastService.showToast('Successfully exited the room', 'success');
          this.loadRooms(); // Reload the rooms to update the UI
        })
        .catch(() => {
          this.toastService.showToast('Error exiting room', 'error');
        });
    } else {
      this.toastService.showToast('User not authenticated', 'error');
    }
  }
}
