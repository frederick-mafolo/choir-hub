import { Component, OnInit } from '@angular/core';
import { Database, get, push, ref, remove, set, update } from '@angular/fire/database';
import { RoomService } from 'src/app/services/room.service';
import { ActivatedRoute } from '@angular/router';
import categoriesData from '../../../assets/data/categories.json';
@Component({
  selector: 'app-technical-team',
  templateUrl: './technical-team.component.html',
  styleUrls: ['./technical-team.component.scss']
})
export class TechnicalTeamComponent implements OnInit {
  rooms: { id: string; name: string }[] = [];
  selectedRoom: { id: string; name: string } | null = null;
  selectedCategory = '';
  categoryMessages: string[] = [];
  categoriesItems: { [key: string]: string[] } = categoriesData
  selectedMessages: { message: string; category: string, id:string }[] = [];
  currentRoomId: string | null = '';

  constructor(private db: Database, private roomService: RoomService,private route: ActivatedRoute) {
   
  }

  ngOnInit(): void {
    this.roomService.currentRoom$.subscribe((res:any) => {
      this.currentRoomId = res?.id || null;
      if (this.currentRoomId) {
        this.loadRoomData(this.currentRoomId);
      }
    });

    this.getCategoryMesseges();
  }

  getCategoryMesseges(){
    this.selectedCategory = this.route.snapshot.paramMap.get('category') || '';
    this.categoryMessages = this.categoriesItems[this.selectedCategory] || [];
  }

  async loadRoomData(currentRoomId:string) {

      const roomMessagesRef = ref(this.db, `rooms/${currentRoomId}/messages`);
      const snapshot = await get(roomMessagesRef);
      const messages = snapshot.val();
      this.selectedMessages = messages
        ? Object.keys(messages).map((key) =>({
          id: key,
           ...messages[key]})
          )
        : [];
  }

  selectMessage(item: string) {
    this.saveMessage({ message: item, category:this.selectedCategory });
  }

  async saveMessage(newMessage: { message: string; category: string}): Promise<void> {
    if (!this.currentRoomId) return;

      const messageRef = push(ref(this.db, `rooms/${this.currentRoomId}/messages`)); // Create new message reference in Firebase
      let currentMessageId = messageRef.key || ''; // Store the message ID
      this.selectedMessages.push( {id:currentMessageId,message:newMessage.message, category: newMessage.category});

      const roomMessagesRef = ref(this.db, `rooms/${this.currentRoomId}/messages/${currentMessageId}`);
      await set(roomMessagesRef, { category: newMessage.category, message: newMessage.message }).then((res) =>{
      }).catch((error) => {
        console.error(error)
      });
    
  }

  async editMessage(editeMessageData: { id: string; message: string; category: string }) {
    // Find the index of the message with the given ID
    const index = this.selectedMessages.findIndex(message => message.id === editeMessageData.id);
    
    if (index !== -1) {
        // If the message is found, update it using splice
      
        // Update the message in the database as well
        const userRef = ref(this.db, `rooms/${this.currentRoomId}/messages/${editeMessageData.id}`);
        await update(userRef, {
            message: editeMessageData.message,
            category: editeMessageData.category
        }).then(() =>{
          this.selectedMessages.splice(index, 1, {
            id: editeMessageData.id,
            message: editeMessageData.message,
            category: editeMessageData.category
        });
        }).catch((error) => {
          console.error('Error', error);
        });
    } else {
        console.error('Message not found for ID:', editeMessageData.id);
    }
}
  async removeMessage(messageData:any) {
    const userRef = ref(this.db, `rooms/${this.currentRoomId}/messages/${messageData.id}`);
    try {
    await remove(userRef); 
    // this.selectedMessages = this.selectedMessages.filter(message => message.id !== messageData.id);    
    // this.saveMessage(this.selectedMessages);
  }
    catch (error) {
      console.error(error);
    }
  }
  

}
