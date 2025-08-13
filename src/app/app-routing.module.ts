import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { HomepageComponent } from './pages/homepage/homepage.component';
import { UsersComponent } from './pages/users/users.component';
import { LoginComponent } from './pages/login/login.component';
import { BoardGridComponent } from './pages/board-grid/board-grid/board-grid.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomepageComponent, canActivate: [AuthGuard] },
  { path: 'users', component: UsersComponent, canActivate: [AuthGuard] },
  { path: 'board', component: BoardGridComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
