import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import {
   NbAuthComponent,
   NbLoginComponent,
   NbRegisterComponent,
   NbLogoutComponent,
   NbRequestPasswordComponent,
   NbResetPasswordComponent,
} from '@nebular/auth';

import { Demo2Component } from '../demo2/demo2.component';
import { Demo3Component } from '../demo3/demo3.component';

import { AuthGuard } from './auth-guard.service';

const routes: Routes = [
   {
      path: '',
      component: Demo3Component
   },
   {
      path: 'demo3',
      canActivate: [AuthGuard],
      component: Demo3Component
   },
   {
      path: 'demo3/:dataset',
      canActivate: [AuthGuard],
      component: Demo3Component
   },
   {
      path: 'auth',
      component: NbAuthComponent,
      children: [
         {
            path: '',
            component: NbLoginComponent,
         },
         {
            path: 'login',
            component: NbLoginComponent,
         },
         {
            path: 'register',
            component: NbRegisterComponent,
         },
         {
            path: 'logout',
            component: NbLogoutComponent,
         },
         {
            path: 'request-password',
            component: NbRequestPasswordComponent,
         },
         {
            path: 'reset-password',
            component: NbResetPasswordComponent,
         },
      ],
   },
];

@NgModule({
   imports: [
      CommonModule,
      RouterModule.forRoot(routes)
   ],
   exports: [RouterModule],
   declarations: []
})
export class RoutingModule { }
