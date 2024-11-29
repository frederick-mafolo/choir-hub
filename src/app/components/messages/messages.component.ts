import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { Database ,ref, update} from '@angular/fire/database';
import { Message } from 'src/app/models/message';
import { RoomService } from 'src/app/services/room.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessagesComponent implements OnInit{
  @Input() messages: { message: string; category: string ; id:string, isCompleted: boolean}[] = [];
  @Output() messageAdded = new EventEmitter<{ message: string; category: string,isCompleted: boolean }>();
  @Output() messageEdited = new EventEmitter<Message>();
  @Output() messageRemoved = new EventEmitter<{ id:string, index:number}>();

  newMessage: string = '';
  editedMessage: string = '';
  isEditing: boolean[] = [];
  currentRoomId: string | null = '';
  constructor(private roomService: RoomService,private db: Database,){

  }

  ngOnInit(): void{
    this.roomService.currentRoom$.subscribe((res:any) => {
      this.currentRoomId = res?.id || null;
    });
  }
  addMessage() {
    if (this.newMessage.trim()) {
      this.messageAdded.emit({ message: this.newMessage, category: 'Custom',isCompleted:false });
      // this.messages.push({ message: this.newMessage, category: 'Custom' });
      this.newMessage = '';
    }
  }

  removeMessage(messageId:string,index: number) {
    this.messages.splice(index, 1);
    this.messageRemoved.emit({id:messageId, index:index});
  }

  enableEdit(index: number) {
    this.isEditing[index] = true;
    this.editedMessage = this.messages[index].message; // Store the current message for editing
  }

  onKeyDown(event: KeyboardEvent) {
    // Allow default behavior for arrow keys
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        // Do nothing, let the input handle it
        event.stopPropagation();
    }
  }

  saveEditedMessage(messageId:string, index: number) {
    if (this.editedMessage.trim()) {
      this.messageEdited.emit({ id:messageId, message: this.editedMessage, category:this.messages[index].category, isCompleted: this.messages[index].isCompleted });
         // Update the messages array directly
         const messageIndex = this.messages.findIndex(message => message.id === messageId);
         if (messageIndex !== -1) {
             this.messages[messageIndex].message = this.editedMessage; // Update the message
         }
    }
    this.isEditing[index] = false; // Exit edit mode
    this.editedMessage = ''; // Clear the edited message
  }

  toggleCompleted(message: any) {
    const messageRef = ref(this.db, `rooms/${this.currentRoomId}/messages/${message.id}`);
    update(messageRef, { isCompleted: message.isCompleted })
      .then(() => {
     
      })
      .catch((error) => {
        console.error(error);
      });
  }
  
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    // Check if the click was outside of the editing input
    for (let i = 0; i < this.isEditing.length; i++) {
      const inputElement = document.getElementById(`edit-input-${i}`);
      if (this.isEditing[i] && inputElement && !inputElement.contains(event.target as Node)) {
        this.cancelEdit(i);
      }
    }
  }

  cancelEdit(index: number) {
    this.isEditing[index] = false; // Exit edit mode
    this.editedMessage = ''; // Clear the edited message
  }
}