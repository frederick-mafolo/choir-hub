import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor(private functions: Functions) {}

  sendEmail(inviteData: { to: string; subject: string; text: string; }) {
    const sendEmail = httpsCallable(this.functions, 'sendEmail');
    return sendEmail({ to: inviteData.to, subject: inviteData.subject, text: inviteData.text });
  }
}
