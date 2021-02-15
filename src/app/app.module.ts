import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';

import {MatSlideToggleModule, MatSnackBarModule} from '@angular/material';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RoutingModule } from './routing/routing.module';
import { AuthGuard } from './routing/auth-guard.service';

import { GeocodingService } from './services/geocoding.service';
import { GeoDataService } from './services/geo-data.service';

import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { MapService } from './services/map.service';
import { Navigator2Component } from './navigator2/navigator2.component';
import { Ng5SliderModule } from 'ng5-slider';

import { MaterialModule } from './material/material.module';
import { DataService } from './services/data.service';
import { ConfigurationService } from './services/configuration.service';
import { LineChartComponent } from './pages/graphics/line-chart/line-chart.component';
import { SchemaService } from './services/schema.service';
import { CalendarComponent } from './calendar/calendar.component';
// import { BarChartComponent } from './pages/graphics/bar-chart/bar-chart.component';
import { WidgetHostDirective } from './widget-host.directive';
import { TreemapChartComponent } from './pages/graphics/treemap-chart/treemap-chart.component';

import { Md2Module, NoConflictStyleCompatibilityMode } from 'md2';
import { TemporalBandComponent } from './temporal-band/temporal-band.component';
import { BoxPlotComponent } from './box-plot/box-plot.component';
import { TimezoneService } from './services/timezone.service';
import { DensityChartComponent } from './density-chart/density-chart.component';

import { EncrDecrService } from './services/encr-decr.service';

import { NgxSpinnerModule } from 'ngx-spinner';

import { Demo2Component } from './demo2/demo2.component';

//New Theme
import { CoreModule } from './@core/core.module';
import { ThemeModule } from './@theme/theme.module';
import {
   NbButtonModule,
   NbCardModule,
   NbChatModule,
   NbDatepickerModule,
   NbDialogModule, NbIconModule, NbInputModule,
   NbLayoutModule,
   NbMenuModule, NbRadioModule, NbSelectModule,
   NbSidebarModule,
   NbToastrModule,
   NbWindowModule
} from '@nebular/theme';
import { NbPasswordAuthStrategy, NbAuthModule, NbAuthJWTToken } from '@nebular/auth';
import { Demo3Component } from './demo3/demo3.component';
import {HeaderComponent} from "./@theme/components";
import {ECommerceModule} from "./pages/e-commerce/e-commerce.module";
import {LeafletModule} from "@asymmetrik/ngx-leaflet";
import {MapsModule} from "./pages/maps/maps.module";
import {BarChartComponent} from "./pages/graphics/bar-chart/bar-chart.component";
import {GraphicsModule} from "./pages/graphics/graphics.module";
import {ExtraComponentsModule} from "./pages/extra-components/extra-components.module";
import {WindowFormComponent} from "./pages/modal-overlays/window/window-form/window-form.component";
import {ModalOverlaysModule} from "./pages/modal-overlays/modal-overlays.module";
import {DragulaModule, DragulaService} from "ng2-dragula";
import {DialogEquipesComponent} from "./pages/modal-overlays/dialogEquipes/dialog-equipes.component";

export function configProviderFactory1(provider: SchemaService) {
   return () => provider.load();
}

export function configProviderFactory2(provider: GeoDataService) {
   return () => provider.load();
}

@NgModule({
   declarations: [
      AppComponent,
      NavbarComponent,
      Navigator2Component,
      WidgetHostDirective,

      Demo2Component,

      BoxPlotComponent,
      LineChartComponent,
      CalendarComponent,
      // BarChartComponent,
      TemporalBandComponent,
      DensityChartComponent,
      TreemapChartComponent,
      Demo3Component
   ],
   imports: [
      BrowserModule,
      BrowserAnimationsModule,

      HttpModule,
      FormsModule,
      ReactiveFormsModule,

      HttpClientModule,

      NgbModule.forRoot(),

      MaterialModule,
      RoutingModule,

      Md2Module,
      Ng5SliderModule,
      NoConflictStyleCompatibilityMode,

      MatSnackBarModule,
      MatSlideToggleModule,

      NgxSpinnerModule,
      //New Theme
      ThemeModule.forRoot(),
      NbSidebarModule.forRoot(),
      NbMenuModule.forRoot(),
      NbDatepickerModule.forRoot(),
      NbDialogModule.forRoot(),
      NbWindowModule.forRoot(),
      NbToastrModule.forRoot(),
      NbChatModule.forRoot({
         messageGoogleMapKey: 'AIzaSyA_wNuCzia92MAmdLRzmqitRGvCF7wCZPY',
      }),
      CoreModule.forRoot(),
      ThemeModule,
      NbLayoutModule,
      ECommerceModule,
      NbCardModule,
      LeafletModule,
      MapsModule,
      GraphicsModule,
      ExtraComponentsModule,
      NbButtonModule,
      NbRadioModule,
      NbSelectModule,
      NbIconModule,
      ModalOverlaysModule,
      NbInputModule,
      DragulaModule,
		NbAuthModule.forRoot({
			strategies: [
				NbPasswordAuthStrategy.setup({
					name: 'email',

               baseEndpoint: 'api_auth',
					login: {
                  endpoint: '/login',
                  method: 'post',
               	redirect: {
               		success: '/',
               		failure: null,
               	},
             	},
					register: {
                  endpoint: '/register',
                  method: 'post',
              		redirect: {
               		success: 'auth/login',
            			failure: null,
            		},
             	},
               logout: {
                  endpoint: '/logout',
                  method: 'post',
              		redirect: {
               		success: 'auth/login',
            			failure: null,
            		},
               },
					token: {
						class: NbAuthJWTToken,
						key: 'token',
					},
				}),
			],
			forms: {
            login: {
               rememberMe: false,
            },
				validation: {
      			password: {
        				required: true,
        				minLength: 6,
        				maxLength: 50,
      			},
      			email: {
        				required: true,
      			},
      			fullName: {
        				required: true,
      				minLength: 4,
      				maxLength: 50,
      			},
    			},
			},
		}),
   ],
   providers: [
      SchemaService,
      {
         provide: APP_INITIALIZER,
         useFactory: configProviderFactory1,
         deps: [SchemaService],
         multi: true
      },
      GeoDataService,
      {
         provide: APP_INITIALIZER,
         useFactory: configProviderFactory2,
         deps: [GeoDataService],
         multi: true
      },
      GeocodingService,
      MapService,
      DataService,
      ConfigurationService,
      TimezoneService,
      EncrDecrService,
      DragulaService,
      AuthGuard
   ],
   bootstrap: [AppComponent],
   entryComponents: [
      BarChartComponent,
      LineChartComponent,
      CalendarComponent,
      TemporalBandComponent,
      BoxPlotComponent,
      DensityChartComponent,
      TreemapChartComponent,
      Navigator2Component,
      WindowFormComponent,
      DialogEquipesComponent
   ]
})
export class AppModule { }
