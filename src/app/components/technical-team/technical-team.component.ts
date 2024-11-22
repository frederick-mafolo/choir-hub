import { Component, OnInit } from '@angular/core';
import { Database, get, ref, set } from '@angular/fire/database';
import { RoomService } from 'src/app/services/room.service';
import { ActivatedRoute } from '@angular/router';

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

  categoriesItems: { [key: string]: string[] } = {
    Drums: ["Bass drum is low in volume", "Cymbals are too sharp"],
    Keyboards: ["Keyboard is on mute", "I can't hear myself"],
    Vocals: ["The mic is off", "Reduce the lead mic"],
    Guitar: ["Add more reverb", "Guitar is too loud"],
    Bass: ["I can't hear myself", "Increase the volume"],
    "Sound Engineers": ["Adjust EQ on vocals", "Drums are overpowering the mix"]
  };


  selectedMessages: { message: string; category: string }[] = [];
  currentRoomId: string | null = '';

  constructor(private db: Database, private roomService: RoomService,private route: ActivatedRoute) {}

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

  onCategorySelected(category: string) {
    this.selectedCategory = category;
    // this.categoryMessages = this.bandCategories[category] || [];
  }


  async loadRoomData(currentRoomId:string) {

      const roomMessagesRef = ref(this.db, `rooms/${currentRoomId}/messages`);
      const snapshot = await get(roomMessagesRef);
      const messages = snapshot.val();
      this.selectedMessages = messages
        ? Object.keys(messages).map((key) => messages[key])
        : [];
   console.log(this.selectedMessages)
  }

  selectMessage(item: string) {
    this.selectedMessages.push({ message: item, category:this.selectedCategory });
    
    this.saveMessage(this.selectedMessages);
  }

  async saveMessage(selectedMessages: { message: string; category: string; }[]) {
    if (!this.currentRoomId) return;
    const roomMessagesRef = ref(this.db, `rooms/${this.currentRoomId}/messages`);
    await set(roomMessagesRef, selectedMessages);
  }

  addMessage(message:any) {
    let messageObject = {message, category:this.selectedCategory}
    this.selectedMessages.push(messageObject);
    this.saveMessage(this.selectedMessages);
  }

  asHTMLInputElement(control: any): HTMLInputElement {
    return control as HTMLInputElement;
  }
  
  removeMessage(item: any) {
    let index = item.value
    this.selectedMessages.splice(index, 1);
    this.saveMessage(this.selectedMessages);
  }
  

}
