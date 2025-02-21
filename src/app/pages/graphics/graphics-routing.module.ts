import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GraphicsComponent } from './graphics.component';
/*import { AlertComponent } from './alert/alert.component';
import { ProgressBarComponent } from './progress-bar/progress-bar.component';
import { SpinnerComponent } from './spinner/spinner.component';
import { CalendarComponent } from './calendar/calendar.component';
import { ChatComponent } from './chat/chat.component';
import { CalendarKitFullCalendarShowcaseComponent } from './calendar-kit/calendar-kit.component';*/

const routes: Routes = [{
  path: '',
  component: GraphicsComponent,
  children: [
    /*{
      path: 'calendar',
      component: CalendarComponent,
    },
    {
      path: 'progress-bar',
      component: ProgressBarComponent,
    },
    {
      path: 'spinner',
      component: SpinnerComponent,
    },
    {
      path: 'alert',
      component: AlertComponent,
    },
    {
      path: 'calendar-kit',
      component: CalendarKitFullCalendarShowcaseComponent,
    },
    {
      path: 'chat',
      component: ChatComponent,
    },*/
  ],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GraphicsRoutingModule {
}
