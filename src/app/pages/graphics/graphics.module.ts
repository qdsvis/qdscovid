import { NgModule } from '@angular/core';
import {
   NbActionsModule,
   NbAlertModule,
   NbButtonModule,
   NbCalendarKitModule,
   NbCalendarModule,
   NbCalendarRangeModule,
   NbCardModule,
   NbChatModule,
   NbIconModule, NbInputModule, NbPopoverModule,
   NbProgressBarModule,
   NbSelectModule,
   NbSpinnerModule,
   NbTabsetModule,
} from '@nebular/theme';

import { ThemeModule } from '../../@theme/theme.module';
import { GraphicsRoutingModule } from './graphics-routing.module';

// components
import { GraphicsComponent } from './graphics.component';
import { BarChartComponent } from './bar-chart/bar-chart.component';
/*import { SpinnerInTabsComponent } from './spinner/spinner-in-tabs/spinner-in-tabs.component';
import { SpinnerInButtonsComponent } from './spinner/spinner-in-buttons/spinner-in-buttons.component';
import { SpinnerSizesComponent } from './spinner/spinner-sizes/spinner-sizes.component';
import { SpinnerColorComponent } from './spinner/spinner-color/spinner-color.component';
import { SpinnerComponent } from './spinner/spinner.component';
import {
  InteractiveProgressBarComponent,
} from './progress-bar/interactive-progress-bar/interactive-progress-bar.component';
import { ProgressBarComponent } from './progress-bar/progress-bar.component';
import { AlertComponent } from './alert/alert.component';
import { ChatComponent } from './chat/chat.component';
import { CalendarComponent } from './calendar/calendar.component';
import { DayCellComponent } from './calendar/day-cell/day-cell.component';
import { NebularFormInputsComponent } from './form-inputs/nebular-form-inputs.component';
import { NebularSelectComponent } from './form-inputs/nebular-select/nebular-select.component';
import { CalendarKitFullCalendarShowcaseComponent } from './calendar-kit/calendar-kit.component';
import { CalendarKitMonthCellComponent } from './calendar-kit/month-cell/month-cell.component';
import {NavigatorComponent} from "./navigator/navigator.component";*/
import {FormsModule} from "@angular/forms";
import {LineChartComponent} from "./line-chart/line-chart.component";
import {CalendarComponent} from "../../calendar/calendar.component";
import {TemporalBandComponent} from "../../temporal-band/temporal-band.component";
import {BoxPlotComponent} from "../../box-plot/box-plot.component";
import {DensityChartComponent} from "../../density-chart/density-chart.component";
import {TreemapChartComponent} from "./treemap-chart/treemap-chart.component";
import {Navigator2Component} from "../../navigator2/navigator2.component";
import {NbDateFnsDateModule} from "@nebular/date-fns";
import {NbMomentDateModule} from "@nebular/moment";
import {RouterModule} from "@angular/router";
import {Ng2SmartTableModule} from "ng2-smart-table";

const COMPONENTS = [
  GraphicsComponent,
  BarChartComponent
  /*AlertComponent,
  ProgressBarComponent,
  InteractiveProgressBarComponent,
  SpinnerComponent,
  SpinnerColorComponent,
  SpinnerSizesComponent,
  SpinnerInButtonsComponent,
  SpinnerInTabsComponent,
  CalendarComponent,
  DayCellComponent,
  ChatComponent,
  NebularFormInputsComponent,
  NebularSelectComponent,
  CalendarKitFullCalendarShowcaseComponent,
  CalendarKitMonthCellComponent,
   NavigatorComponent*/
];

const MODULES = [
  NbAlertModule,
  NbActionsModule,
  NbButtonModule,
  NbCalendarModule,
  NbCalendarKitModule,
  NbCalendarRangeModule,
  NbCardModule,
  NbChatModule,
  NbIconModule,
  NbProgressBarModule,
  NbSelectModule,
  NbSpinnerModule,
  NbTabsetModule,
  ThemeModule,
  GraphicsRoutingModule,
  NbMomentDateModule,
];

@NgModule({
   imports: [
      ...MODULES,
      FormsModule,
      NbInputModule,
      NbPopoverModule,
      NbDateFnsDateModule.forRoot({
         parseOptions: {awareOfUnicodeTokens: true},
         formatOptions: {awareOfUnicodeTokens: true},
      }),
      Ng2SmartTableModule
   ],
   declarations: [
      ...COMPONENTS,
   ],
   exports: [
      BarChartComponent
   ],
   entryComponents: [
      BarChartComponent
   ]
})
export class GraphicsModule { }
