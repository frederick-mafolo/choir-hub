import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PianoComponent } from './components/piano/piano.component';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatMenuModule } from '@angular/material/menu';
import {MatTabsModule} from '@angular/material/tabs';
import {MatDialogModule } from '@angular/material/dialog';

import { FirebaseModule } from './firebase/firebase.module';
import { ToastComponent } from './shared/toast/toast.component';
import { RoomsComponent } from './components/rooms/rooms.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProgressionEditorComponent } from './components/progression-editor/progression-editor.component';
import { EditSongModalComponent } from './components/edit-song-modal/edit-song-modal.component';
import { DeleteConfirmationModalComponent } from './components/delete-confirmation-modal/delete-confirmation-modal.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { ManageRoomsComponent } from './components/manage-rooms/manage-rooms.component';
import { CreateNewRoomComponent } from './components/create-new-room/create-new-room.component';
import { AddMemberComponent } from './components/add-member/add-member.component';

@NgModule({
  declarations: [
    AppComponent,
    PianoComponent,
    ToastComponent,
    RoomsComponent,
    LoginComponent,
    RegisterComponent,
    ProgressionEditorComponent,
    EditSongModalComponent,
    DeleteConfirmationModalComponent,
    ResetPasswordComponent,
    LandingPageComponent,
    ManageRoomsComponent,
    CreateNewRoomComponent,
    AddMemberComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatTabsModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    FlexLayoutModule,
    MatDialogModule,
    FirebaseModule.forRoot()
  ],
  exports:[RoomsComponent],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
