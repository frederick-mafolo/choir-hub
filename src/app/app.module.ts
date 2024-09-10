import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PianoComponent } from './piano/piano.component';
import { FormsModule } from '@angular/forms';
import { FirebaseApp, initializeApp } from '@angular/fire/app';
import { Database, getDatabase } from '@angular/fire/database';
import { environment } from '../environments/environment';

// Firebase initialization factory
export function initializeFirebaseApp(): FirebaseApp {
  return initializeApp(environment.firebaseConfig);
}

export function initializeFirebaseDatabase(app: FirebaseApp): Database {
  return getDatabase(app);
}

@NgModule({
  declarations: [
    AppComponent,
    PianoComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
  ],
  providers: [
    {
      provide: FirebaseApp,
      useFactory: initializeFirebaseApp
    },
    {
      provide: Database,
      deps: [FirebaseApp],
      useFactory: initializeFirebaseDatabase
    }],
  bootstrap: [AppComponent]
})
export class AppModule { }
