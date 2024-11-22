import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class MessagesComponent {
  @Input() messages: { message: string; category: string }[] = [];
  @Output() messageAdded = new EventEmitter<{ message: string; category: string }>();
  @Output() messageRemoved = new EventEmitter<number>();

  newMessage: string = '';

  addMessage() {
    if (this.newMessage.trim()) {
      this.messageAdded.emit({ message: this.newMessage, category: 'Custom' });
      this.newMessage = '';
    }
  }

  removeMessage(index: number) {
    this.messageRemoved.emit(index);
  }
}
