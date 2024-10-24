import { Component, OnInit } from '@angular/core';
import {
  Database,
  ref,
  get,
  push,
  update,
  set,
  remove,
  query,
  orderByChild,
  equalTo,
} from '@angular/fire/database';
import { ToastService } from 'src/app/services/toast.service';
import { DeleteConfirmationModalComponent } from '../delete-confirmation-modal/delete-confirmation-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { CreateNewRoomComponent } from '../create-new-room/create-new-room.component';
import { Auth, getAuth, user } from '@angular/fire/auth';
import { AuthService } from 'src/app/services/auth.service';
import { RoomService } from 'src/app/services/room.service';
import { EmailService } from 'src/app/services/email.service';
import { AddMemberComponent } from '../add-member/add-member.component';

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
    private dialog: MatDialog,
    private emailService:EmailService
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
        // Use room names from the user's rooms data instead of fetching from the rooms node
        this.rooms = Object.keys(rooms).map(roomId => ({
          id: roomId,
          name: rooms[roomId]?.name || roomId,  // Use the room name or default to roomId
        }));
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


  openAddMemberDialog(roomId: string, roomName: string): void {
    const dialogRef = this.dialog.open(AddMemberComponent);
  
    dialogRef.afterClosed().subscribe((email) => {
      if (roomId) {
        const userRef = ref(this.db, `users`); // Reference to the users node in Firebase
        // Query the 'users' node for a user with the matching email
        const emailQuery = query(userRef, orderByChild('email'), equalTo(email));
        
        get(emailQuery)
          .then((snapshot) => {
            if (snapshot.exists()) {
              const userData = snapshot.val();
              const userId = Object.keys(userData)[0]; // Get the userId of the first match
              const userEmail = userData[userId].email; // Get the matched user's email
              const user = { uid: userId, email: userEmail };
              this.addUserToRoom(user, roomId, roomName); // Add the user to the room
            } else {
              // If the user is not found, send an invite email
              this.sendInviteEmail(email, roomId);
            }
          })
          .catch((error) => {
            this.toastService.showToast('Error searching for user', 'error');
            console.error(error);
          });
      }
    });
  }
  

    // Add existing user to the room
    addUserToRoom(userData: object, roomId: string,roomName:string): void {
      const user = this.auth.currentUser; // Get current authenticated user
      if (!user) {
        this.toastService.showToast('User not authenticated', 'error');
        return;
      }
      
      this.roomService.joinRoom(userData,roomId, roomName).subscribe({
        next: () => {
          // Room created successfully
          // this.roomJoined.emit(roomId);
          this.roomService.setCurrentRoom(roomId, roomName);
          // this.closePopup();
          this.toastService.showToast('User added to the room', 'success');
        },
        error: (error) => {
          // Handle any error
          this.toastService.showToast('Error adding user to room', 'error');
  
          console.error('Room creation failed', error);
        }
      });
  
    }
    
    // Send invitation email to non-registered user
    sendInviteEmail(email: string, roomId: string): void {
      const baseUrl = window.location.origin;
      const inviteLink = `${baseUrl}/register?roomId=${roomId}`;
    
      const inviteData = {
        to: email,
        subject: 'Join Room Invitation',
        text: `You have been invited to join a room. Click the link to register and join the room: ${inviteLink}`
      };
    
      // Use an email service to send the email
      this.emailService.sendEmail(inviteData)
        .subscribe({
          next: () => {
            this.toastService.showToast('Invitation sent!', 'success');

          },
          error: (error) => {
            console.error('Room creation failed', error);

            this.toastService.showToast('Failed to send invitation', 'error');
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

  shareRoomLink(roomId: string): void {
    const baseUrl = window.location.origin; // Get the current domain
    const roomLink = `${baseUrl}/join-room/${roomId}`; // Construct the link to join room
    
    // Copy the link to the clipboard
    navigator.clipboard.writeText(roomLink).then(() => {
      this.toastService.showToast('Room link copied to clipboard!', 'success');
    }).catch(() => {
      this.toastService.showToast('Failed to copy room link', 'error');
    });
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
      // Remove the room from the user's list of rooms
      const userRoomsRef = ref(this.db, `users/${user.uid}/rooms/${roomId}`);
      remove(userRoomsRef)
        .then(() => {
          this.toastService.showToast('Successfully exited the room', 'success');
          this.loadRooms(); // Reload the rooms to update the UI
          this.selectedRoom = null; // Clear the selected room
        })
        .catch(() => {
          this.toastService.showToast('Error exiting room', 'error');
        });
    } else {
      this.toastService.showToast('User not authenticated', 'error');
    }
  }
  
}
