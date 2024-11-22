import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { RoomsComponent } from './components/rooms/rooms.component';
import { PianoComponent } from './components/piano/piano.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { ManageRoomsComponent } from './components/manage-rooms/manage-rooms.component';
import { TechnicalTeamComponent } from './components/technical-team/technical-team.component';
import { CategoriesComponent } from './components/categories/categories.component';

const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'rooms', component: RoomsComponent, canActivate: [AuthGuard] },
  { path: 'home', component: PianoComponent, canActivate: [AuthGuard] },
  { path: 'manage-rooms', component: ManageRoomsComponent,canActivate: [AuthGuard] },
  { path: 'technical-team', component: CategoriesComponent,canActivate : [AuthGuard] },
  { path: 'messages/:category', component: TechnicalTeamComponent ,canActivate : [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'landing-page', component: LandingPageComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'reset-password', component: ResetPasswordComponent},
  { path: '', redirectTo: '/landing-page', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' } 

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
