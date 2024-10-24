import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor(private functions: Functions) {}

  sendEmail(inviteData: { to: string; subject: string; text: string }): Observable<any> {
    const sendEmail = httpsCallable(this.functions, 'sendEmail');
  
    // Wrap the httpsCallable in an Observable
    return new Observable(observer => {
      sendEmail({ to: inviteData.to, subject: inviteData.subject, text: inviteData.text })
        .then(response => {
          observer.next(response); // Emit the response
          observer.complete(); // Complete the Observable
        })
        .catch(error => {
          console.error('Error sending email:', error);
          observer.error(error); // Emit the error
        });
    });
  }
}
