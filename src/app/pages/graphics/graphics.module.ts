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

import {FormsModule} from "@angular/forms";
import {LineChartComponent} from "./line-chart/line-chart.component";
import {TemporalBandComponent} from "../../temporal-band/temporal-band.component";
import {BoxPlotComponent} from "../../box-plot/box-plot.component";
import {DensityChartComponent} from "../../density-chart/density-chart.component";
import {TreemapChartComponent} from "./treemap-chart/treemap-chart.component";
import {CalendarComponent} from "./calendar/calendar.component";
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
