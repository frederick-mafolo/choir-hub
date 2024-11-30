import { Component, OnInit } from '@angular/core';
import {
  Database,
  ref,
  get,
  update,
  set,
  remove,
  query,
  orderByChild,
  equalTo,
  onValue,
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
import { BlockedUsersDialogComponent } from '../blocked-users-dialog/blocked-users-dialog.component';

export interface User { 
  id: string; 
  name: string; 
  email: string; 
  admin?: boolean;
  blocked?:boolean
}
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
    blockedUsers: User[];
    users: User[];
  } | null = null;
  newRoomName: string = '';
  userData!: {
    uid: string;
    email: string;
    name: string;
  };

  isAdmin: boolean = false;
  constructor(
    private db: Database,
    private auth: Auth,
    private authService: AuthService,
    private toastService: ToastService,
    private roomService: RoomService,
    private dialog: MatDialog,
    private emailService: EmailService
  ) {}

  ngOnInit(): void {
    this.authService.getUserData().subscribe((data) => {
      this.userData = data;
      this.loadRooms();
    });
  }

  // Load rooms with their names

  async loadRooms() {
    try {
      this.rooms = [];
      this.selectedRoom = null;
      const userRoomsRef = ref(this.db, `users/${this.userData?.uid}/rooms`);
       onValue(userRoomsRef, (snapshot) =>{
        const rooms = snapshot.val();

        // Check if rooms exist
        if (rooms) {
          // Use room names from the user's rooms data instead of fetching from the rooms node
          this.rooms = Object.keys(rooms).map((roomId) => ({
            id: roomId,
            name: rooms[roomId]?.name || roomId, // Use the room name or default to roomId
          }));
        } else {
          this.rooms = [];
        }
       })

     
    } catch (error) {
      console.error(error);
      this.toastService.showToast('Error loading joined rooms', 'error');
    }
  }

  // Select a room to view users
  async selectRoom(room: { id: string; name: string }) {
    this.selectedRoom = { ...room, users: [], blockedUsers: [] };
    
  
    const selectedRoomRef = ref(this.db, `rooms/${room.id}`)
    onValue(selectedRoomRef,(roomSnapshot) =>{
      const roomData = roomSnapshot.exists() ? roomSnapshot.val() : null;
      if (this.selectedRoom){
      if (roomData.admins) {
        // Check if the current user is an admin by looking at the admins object
        this.isAdmin = roomData.admins && roomData.admins[this.userData?.uid] === true;
        this.selectedRoom.admin = Object.keys(roomData.admins).find(
          (key) => key === this.userData?.uid
        )  || '';
        this.selectedRoom.blockedUsers = roomData.blockedUsers;
      }
      const users = roomData.users;
      if (users) {
        this.selectedRoom.users = Object.keys(users).map((userId) => ({
          id: userId,
          name: users[userId].diplayName || this.getUsernameFromEmail(users[userId].email),
          email: users[userId].email,
          admin: roomData.admins ? roomData?.admins[userId] === true : false,
          blocked: users[userId].blocked || false,
        }));
      }

      // Populate `blockedUsers` array
      const blockedUsers = roomData.blockedUsers || {};
      if (blockedUsers) {
        this.selectedRoom.blockedUsers = Object.keys(blockedUsers).map(
          (userId) => ({
            id: userId,
            name: blockedUsers[userId].name || this.getUsernameFromEmail(blockedUsers[userId].email),
            email: blockedUsers[userId].email,
            admin: !!blockedUsers[userId].admin,
            blocked: blockedUsers[userId].blocked || true,
          })
        );
      }

      this.newRoomName = this.selectedRoom.name;
    }

    });
    

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
      if (email) {
        const userRef = ref(this.db, `users`); // Reference to the users node in Firebase
        // Query the 'users' node for a user with the matching email
        const emailQuery = query(
          userRef,
          orderByChild('email'),
          equalTo(email)
        );

        get(emailQuery)
          .then((snapshot) => {
            if (snapshot.exists()) {

              const userData = snapshot.val();
              const userId = Object.keys(userData)[0]; // Get the userId of the first match
              const userEmail = userData[userId].email; // Get the matched user's email
              const displayName = userData[userId].displayName; // Get the user's displayName
              const user = { uid: userId, email: userEmail, displayName:displayName };
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

    // Open dialog to show blocked users
    openBlockedUsersPopup() {
      const dialogRef = this.dialog.open(BlockedUsersDialogComponent, {
        width: '400px',
        data: { blockedUsers: this.selectedRoom?.blockedUsers },
      });
  
      dialogRef.afterClosed().subscribe((userId) => {
        if (userId && this.selectedRoom?.id && this.selectedRoom?.name) {
          this.unblockUser(userId, this.selectedRoom?.id, this.selectedRoom?.name);
        }
      });
    }
  // Add existing user to the room
  addUserToRoom(userData: any, roomId: string, roomName: string): void {
    const user = this.auth.currentUser; // Get current authenticated user
    if (!user) {
      this.toastService.showToast('User not authenticated', 'error');
      return;
    }

    this.roomService.joinRoom(userData, roomId, roomName).subscribe({
      next: () => {
        // Room created successfully
        // this.roomJoined.emit(roomId);
        
        this.roomService.setActivityLog(`added: ${userData.email} to the room`, this.userData, roomId).subscribe({
          next: () => {},
          error: (err) =>{ console.error('Failed to log activity:', err)}
          }); 
        this.roomService.setCurrentRoom(roomId, roomName);
        // this.closePopup();
        this.toastService.showToast('User added to the room', 'success');
      },
      error: (error) => {
        // Handle any error
        this.toastService.showToast('Error adding user to room', 'error');

        console.error('Room creation failed', error);
      },
    });
  }

  // Send invitation email to non-registered user
  sendInviteEmail(email: string, roomId: string): void {
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}/register?roomId=${roomId}`;

    const inviteData = {
      to: email,
      subject: 'Join Room Invitation',
      text: `You have been invited to join a room. Click the link to register and join the room: ${inviteLink}`,
    };

    // Use an email service to send the email
    this.emailService.sendEmail(inviteData).subscribe({
      next: () => {
        
        this.roomService.setActivityLog(`sent the invite to: ${email}`, this.userData, roomId).subscribe({
          next: () => {},
          error: (err) =>{ console.error('Failed to log activity:', err)}
         }); 
        this.toastService.showToast('Invitation sent!', 'success');
      },
      error: (error) => {
        console.error('Room creation failed', error);

        this.toastService.showToast('Failed to send invitation', 'error');
      },
    });
  }

  getUsernameFromEmail(email: string): string {
    if (!email) return ''; // Handle cases where email is empty or null
    const username = email.split('@')[0]; // Get the part before '@'
    return username.replace(/\./g, ' '); // Replace dots with spaces
  }

  // Edit the name of the selected room
  async editRoomName() {
    if (this.selectedRoom && this.newRoomName.trim()) {
      const currentUser = this.auth.currentUser;

      // Check if the current user is allowed to remove others
      if (currentUser?.uid !== this.selectedRoom.admin) {
        this.toastService.showToast(
          'Only the admin can remove users!',
          'error'
        );
        return;
      }

      const roomRef = ref(this.db, `rooms/${this.selectedRoom.id}`);
      await update(roomRef, { name: this.newRoomName })
        .then(() => {
          
          this.roomService.setActivityLog(`changed the room name to ${this.newRoomName}`, this.userData, this.selectedRoom?.id as string).subscribe({
            next: () => {},
            error: (err) =>{ console.error('Failed to log activity:', err)}
           }); 
        })
        .catch(() => {
          this.toastService.showToast('Error editing name', 'error');
        });
      this.toastService.showToast('Room name updated!', 'success');
      this.selectedRoom.name = this.newRoomName;
      // this.loadRooms(); 
    }
  }

  shareRoomLink(roomId: string): void {
    const baseUrl = window.location.origin; // Get the current domain
    const roomLink = `${baseUrl}/join-room/${roomId}`; // Construct the link to join room

    // Copy the link to the clipboard
    navigator.clipboard
      .writeText(roomLink)
      .then(() => {

        this.roomService.setActivityLog(`Shared the link`, this.userData, roomId).subscribe({
          next: () => {},
          error: (err) =>{ console.error('Failed to log activity:', err)}
         }); 
        this.toastService.showToast(
          'Room link copied to clipboard!',
          'success'
        );
      })
      .catch(() => {
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
        this.toastService.showToast(
          'Only the admin can remove users!',
          'error'
        );
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

          this.roomService.setActivityLog(`copied room id`, this.userData, roomId).subscribe({
            next: () => {},
            error: (err) =>{ console.error('Failed to log activity:', err)}
           }); 
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

// Remove a user from the room
async removeUser(userId: string, userName:string): Promise<void> {
  if (!this.selectedRoom) return;

  const currentUser = this.auth.currentUser;

  if (currentUser?.uid !== this.selectedRoom.admin && userId !== currentUser?.uid) {
    this.toastService.showToast('Only the admin can remove users!', 'error');
    return;
  }

  const userRef = ref(this.db, `rooms/${this.selectedRoom.id}/users/${userId}`);
  try {
    await remove(userRef); // Remove user from room's users list

    this.roomService.setActivityLog(`removed ${userName} from the room`, this.userData, this.selectedRoom.id).subscribe({
      next: () => {},
      error: (err) =>{ console.error('Failed to log activity:', err)}
     }); 
    await this.checkAndAssignAdmin(this.selectedRoom.id, this.selectedRoom.name); // Check and assign new admin if necessary

    // Also remove the room from the user's list
    const userRoomsRef = ref(this.db, `users/${userId}/rooms/${this.selectedRoom.id}`);
    await remove(userRoomsRef);
    this.toastService.showToast(`User removed ${userName} from room!`, 'success');
  } catch (error) {
    this.toastService.showToast('Failed to remove the user', 'error');
  }
}

  // Helper method to check for admins and assign a new one if necessary
private async checkAndAssignAdmin(roomId: string, roomName: string): Promise<void> {
  const roomUsersRef = ref(this.db, `rooms/${roomId}/users`);
  const usersSnapshot = await get(roomUsersRef);
  const remainingUsers = usersSnapshot.val();

  if (!remainingUsers) {
    // Delete the room if no users remain
    const roomRef = ref(this.db, `rooms/${roomId}`);
    await remove(roomRef);
    this.toastService.showToast('Room deleted as no users remain!', 'success');
    return;
  }

  // Check if any user is an admin
  const hasAdmin = Object.values(remainingUsers).some((user: any) => user.admin);
  console.log(hasAdmin)
  // If there are no admins, assign a new random admin
  if (!hasAdmin) {
    const remainingUserIds = Object.keys(remainingUsers);
    const newAdminId = remainingUserIds[Math.floor(Math.random() * remainingUserIds.length)];
    await this.makeAsAdmin(newAdminId, roomId,roomName);
    console.log("New Admin", newAdminId)
    this.toastService.showToast(`New admin assigned in room "${roomName}".`, 'info');
  }
}

  
  async exitRoom(roomId: string) {
    const user = this.auth.currentUser; // Get the current user
    if (user) {
      const userData = {
        uid: user?.uid,
        email: user?.email,
        displayName: user.displayName || this.getUsernameFromEmail(user?.email || ''),
      };
      // Remove the room from the user's list of rooms
     this.roomService.exitRoom(userData, roomId).subscribe({
      next:() =>{
     
        this.selectedRoom = null; // Clear the selected room
      },
      error:() =>{
        this.toastService.showToast('Error exiting room', 'error');
      }

     }) 
    } else {
      this.toastService.showToast('User not authenticated', 'error');
    }
  }
  
  async makeAsAdmin(userId: string, roomId: string, roomName:string): Promise<void> {
    try {
      // Fetch user data from the room's user list
      const userRef = ref(this.db, `rooms/${roomId}/users/${userId}`);
      const userSnapshot = await get(userRef);
  
      if (!userSnapshot.exists()) {
        this.toastService.showToast('User not found in the room', 'error');
        return;
      }
  
      const userData = userSnapshot.val();
  
      // Set the new admin in the room by adding userId to the admins node
      const roomAdminRef = ref(this.db, `rooms/${roomId}/admins/${userId}`);
      await set(roomAdminRef, true).then(() => { 
        this.roomService.setActivityLog(`assigned ${userData.email} as the admin`, this.userData, roomId).subscribe({
          next: () => {},
          error: (err) =>{ console.error('Failed to log activity:', err)}
         }); 

        // Update the user data to mark them as an admin in their profile under the room's users
       set(userRef, {
        ...userData,
        admin: true,
      });
  
      }).catch(error => {
        console.log(error)
      })
  

      // Reload the rooms and notify of success
    
      this.toastService.showToast(
        `${userData.email} is now set as an admin`,
        'success'
      );
    } catch (error) {
      console.error('Error making user admin:', error);
      this.toastService.showToast('Failed to assign admin', 'error');
    }
  }
  

// Dismiss admin privileges
async dismissAsAdmin(userId: string, roomId: string, roomName: string): Promise<void> {
  try {
    const userRef = ref(this.db, `rooms/${roomId}/users/${userId}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      this.toastService.showToast('User not found in the room', 'error');
      return;
    }

    const userData = userSnapshot.val();
    await set(userRef, { ...userData, admin: false }); // Remove admin privileges

    // Remove the userId from the admins object in the room
    const adminRef = ref(this.db, `rooms/${roomId}/admins/${userId}`);
    await remove(adminRef).then(() => {
      this.roomService.setActivityLog(`unassigned ${userData.email} as the admin`, this.userData, roomId).subscribe({
        next: () => {},
        error: (err) =>{ console.error('Failed to log activity:', err)}
       }); 
       this.toastService.showToast(`${userData.email} is no longer an admin`, 'warning');

       this.checkAndAssignAdmin(roomId, roomName); // Check and assign new admin if necessary
    
    }).catch(err => console.error(err))

    
  } catch (error) {
    console.error('Error dismissing admin privileges:', error);
    this.toastService.showToast('Failed to dismiss admin privileges', 'error');
  }
}

  // Block user: Move user from `users` to `blockedUsers` with `blocked: true`
  async blockUser(userId: string, roomId: string, roomName:string): Promise<void> {
    try {
      const userRef = ref(this.db, `rooms/${roomId}/users/${userId}`);
      const userSnapshot = await get(userRef);

      if (!userSnapshot.exists()) {
        this.toastService.showToast('User not found in the room', 'error');
        return;
      }

      const userData = userSnapshot.val();
  // Sanitize email by replacing "." with ","
      const sanitizedEmail = userData.email.replace(/\./g, ',');
      const email = userData.email;
      // Move user to `blockedUsers` with blocked flag
      const blockedUserRef = ref(
        this.db,
        `rooms/${roomId}/blockedUsers/${userId}`
      );
      await set(blockedUserRef, { ...userData, blocked: true }).then(() => {

        this.roomService.setActivityLog(`blocked ${userData.email}`, this.userData, roomId).subscribe({
          next: () => {},
          error: (err) =>{ console.error('Failed to log activity:', err)}
         });   
           // Move user to `blockedUsers` with blocked flag
       const blockedEmailRef = ref(
        this.db,
        `rooms/${roomId}/blockedEmails/${sanitizedEmail}`
      );
      
        set(blockedEmailRef, { email, blocked:true});

        // Remove user from `users`
         remove(userRef);
        let room = { id: roomId, name: roomName }
     
        this.toastService.showToast(
          `${userData.email} has been blocked`,
          'warning'
        );
      }).catch((error) => {
        console.error('Error blocking user:', error);
        this.toastService.showToast('Failed to block user', 'error');
  
      });
       
    } catch (error) {
      console.error('Error blocking user:', error);
      this.toastService.showToast('Failed to block user', 'error');
    }
  }

  // Unblock user: Move user from `blockedUsers` back to `users`
  async unblockUser(userId: string, roomId: string, roomName:string): Promise<void> {
    try {
      const blockedUserRef = ref(this.db, `rooms/${roomId}/blockedUsers/${userId}`);
      const userSnapshot = await get(blockedUserRef);
  
      if (!userSnapshot.exists()) {
        this.toastService.showToast('User not found in the blocked list', 'error');
        return;
      }
  
      const userData = userSnapshot.val();
  
      // Replace `.` with `,` for blockedEmails key
      const sanitizedEmail = userData.email.replace(/\./g, ',');
  
      const blockedEmailRef = ref(this.db, `rooms/${roomId}/blockedEmails/${sanitizedEmail}`);
  
      // Move user back to `users` without blocked flag
      const userRef = ref(this.db, `rooms/${roomId}/users/${userId}`);
      await set(userRef, { ...userData, blocked: false }).then(() => {

        this.roomService.setActivityLog(`unblocked ${userData.email}`, this.userData, roomId).subscribe({
          next: () => {},
          error: (err) =>{ console.error('Failed to log activity:', err)}
         });   

          // Remove user from `blockedUsers`
          remove(blockedUserRef);
  
          // Remove email from `blockedEmails`
          remove(blockedEmailRef);
      })
  
   
  
  
      this.toastService.showToast(`${userData.email} has been unblocked`, 'success');
  
    } catch (error) {
      console.error('Error unblocking user:', error);
      this.toastService.showToast('Failed to unblock user', 'error');
    }
  }
  
}
