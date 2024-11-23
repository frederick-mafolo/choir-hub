import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessagesComponent {
  @Input() messages: { message: string; category: string ; id:string}[] = [];
  @Output() messageAdded = new EventEmitter<{ message: string; category: string }>();
  @Output() messageEdited = new EventEmitter<{ id:string, message: string; category: string}>();
  @Output() messageRemoved = new EventEmitter<{ id:string, index:number}>();

  newMessage: string = '';
  editedMessage: string = '';
  isEditing: boolean[] = [];

  addMessage() {
    if (this.newMessage.trim()) {
      this.messageAdded.emit({ message: this.newMessage, category: 'Custom' });
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
      this.messageEdited.emit({ id:messageId, message: this.editedMessage, category:this.messages[index].category});
         // Update the messages array directly
         const messageIndex = this.messages.findIndex(message => message.id === messageId);
         if (messageIndex !== -1) {
             this.messages[messageIndex].message = this.editedMessage; // Update the message
         }
    }
    this.isEditing[index] = false; // Exit edit mode
    this.editedMessage = ''; // Clear the edited message
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