// firebase.module.ts
import { ModuleWithProviders, NgModule } from '@angular/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFunctions, getFunctions } from '@angular/fire/functions';
import { environment } from '../../environments/environment';

@NgModule({
  imports: []
})
export class FirebaseModule {
  static forRoot(): ModuleWithProviders<FirebaseModule> {
    return {
      ngModule: FirebaseModule,
      providers: [
        provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
        provideDatabase(() => getDatabase()),
        provideAuth(() => getAuth()),
        provideFunctions(() => getFunctions())
      ]
    };
  }
}