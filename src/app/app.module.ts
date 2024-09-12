import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PianoComponent } from './piano/piano.component';
import { FormsModule } from '@angular/forms';

// Firebase imports
// import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
// import { provideDatabase, getDatabase } from '@angular/fire/database';
// import { environment } from '../environments/environment';
import { FirebaseModule } from './firebase/firebase.module';
import { ToastComponent } from './shared/toast/toast.component';

@NgModule({
  declarations: [
    AppComponent,
    PianoComponent,
    ToastComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    FirebaseModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
