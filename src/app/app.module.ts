import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { UsersComponent } from './pages/users/users.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { LoginComponent } from './pages/login/login.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { UserDialogComponent } from './components/user-dialog/user-dialog.component';
import { EditUserDialogComponent } from './components/edit-user-dialog/edit-user-dialog.component';
import { ProfileDialogComponent } from './components/profile-dialog/profile-dialog.component';
import { ChangePasswordDialogComponent } from './components/change-password-dialog/change-password-dialog.component';
import { ForgotPasswordDialogComponent } from './components/forgot-password-dialog/forgot-password-dialog.component';
import { ToastComponent } from './shared/toast/toast.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    UsersComponent,
    SidebarComponent,
    UserDialogComponent,
    EditUserDialogComponent,
    ProfileDialogComponent,
    ChangePasswordDialogComponent,
    ForgotPasswordDialogComponent,
    ToastComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
