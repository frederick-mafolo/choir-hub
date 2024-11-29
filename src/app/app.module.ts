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
import {MatDividerModule} from '@angular/material/divider';
import {MatChipsModule} from '@angular/material/chips';
import {MatSelectModule} from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {MatTableModule} from '@angular/material/table';

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
import { BlockedUsersDialogComponent } from './components/blocked-users-dialog/blocked-users-dialog.component';
import { TechnicalTeamComponent } from './components/technical-team/technical-team.component';
import { MessagesComponent } from './components/messages/messages.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { ProfileSettingsComponent } from './profile-settings/profile-settings.component';
import { ConfirmDeleteModalComponent } from './confirm-delete-modal/confirm-delete-modal.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { ActivityLogComponent } from './components/activity-log/activity-log.component';

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
    AddMemberComponent,
    BlockedUsersDialogComponent,
    TechnicalTeamComponent,
    ProfileSettingsComponent,
    MessagesComponent,
    CategoriesComponent,
    ConfirmDeleteModalComponent,
    UserManagementComponent,
    ActivityLogComponent
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
    MatDividerModule,
    MatTabsModule,
    MatSidenavModule,
    MatListModule,
    MatChipsModule,
    MatCheckboxModule,
    MatIconModule,
    MatToolbarModule,
    MatTableModule,
    MatSelectModule,
    FlexLayoutModule,
    MatDialogModule,
    FirebaseModule.forRoot()
  ],
  exports:[RoomsComponent],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
