import { Component, OnInit, Input } from '@angular/core';
import { Database, ref, get } from '@angular/fire/database';
import { RoomService } from 'src/app/services/room.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  currentRoomId: string = '';
  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm: string = '';
  activityLog: any[] = [];
  selectedRole: string = '';
  selectedStatus: string = '';
  displayedColumns: string[] = ['name', 'email', 'role', 'status', 'actions'];


  constructor(private db: Database, private roomService: RoomService) {}

  ngOnInit(): void {
    this.roomService.currentRoom$.subscribe((res:any) => {
      this.currentRoomId = res?.id || null;
      if (this.currentRoomId) {
        this.loadRoomData(this.currentRoomId);
      }
    });
  }

  async loadRoomData(roomId: string) {
    const roomRef = ref(this.db, `rooms/${roomId}`);
    const snapshot = await get(roomRef);

    if (snapshot.exists()) {
      const roomData = snapshot.val();
      this.users = Object.values(roomData.users || {});
      console.log(this.users)
      this.activityLog = roomData.activityLog || [];
      this.filteredUsers = [...this.users];
    }
  }

  filterUsers() {
    this.filteredUsers = this.users.filter(user => {
      return (
        (!this.searchTerm || user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) || user.email.toLowerCase().includes(this.searchTerm.toLowerCase())) &&
        (!this.selectedRole || user.role === this.selectedRole) &&
        (!this.selectedStatus || user.status === this.selectedStatus)
      );
    });
  }

  viewUserDetails(user: any) {
    console.log('Viewing details for:', user);
  }

  editUser(user: any) {
    console.log('Editing user:', user);
  }

  deleteUser(user: any) {
    console.log('Deleting user:', user);
  }
}
