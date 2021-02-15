import { NgModule } from '@angular/core';
import { AgmCoreModule } from '@agm/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { NgxEchartsModule } from 'ngx-echarts';
import {
   NbAccordionModule,
   NbBadgeModule,
   NbButtonModule,
   NbCardModule, NbIconModule,
   NbRadioModule,
   NbSelectModule
} from '@nebular/theme';

import { ThemeModule } from '../../@theme/theme.module';
import { MapsRoutingModule, routedComponents } from './maps-routing.module';
import {LeafletComponent} from "./leaflet/leaflet.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {ExtraComponentsModule} from "../extra-components/extra-components.module";
import {Ng5SliderModule} from "ng5-slider";
// import {NavigatorComponent} from "../../navigator2/navigator2.component";

@NgModule({
   imports: [
      ThemeModule,
      AgmCoreModule.forRoot({
         apiKey: 'AIzaSyCpVhQiwAllg1RAFaxMWSpQruuGARy0Y1k',
         libraries: ['places'],
      }),
      LeafletModule.forRoot(),
      MapsRoutingModule,
      NgxEchartsModule,
      NbCardModule,
      ReactiveFormsModule,
      NbSelectModule,
      NbAccordionModule,
      NbRadioModule,
      FormsModule,
      NbButtonModule,
      ExtraComponentsModule,
      Ng5SliderModule,
      NbIconModule,
   ],
   exports: [
      LeafletComponent
   ],
  declarations: [
    ...routedComponents,
  ],
})
export class MapsModule { }
