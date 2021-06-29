import {
   AfterViewInit,
   Component,
   ComponentFactoryResolver,
   NgModule,
   OnInit,
   Renderer2,
   ViewChild,
   ViewContainerRef,
   ElementRef
} from '@angular/core';
import {ThemeModule} from "../@theme/theme.module";
import {NgxEchartsModule} from "ngx-echarts";
import {
   NbButtonModule,
   NbCardModule, NbDialogService,
   NbIconModule,
   NbListModule, NbProgressBarModule,
   NbSelectModule,
   NbTabsetModule, NbToastrService,
   NbUserModule, NbWindowService
} from "@nebular/theme";
import * as L from 'leaflet';
import {NgxChartsModule} from "@swimlane/ngx-charts";
import {ChartModule} from "angular2-chartjs";
import {LeafletModule} from "@asymmetrik/ngx-leaflet";
import {ECommerceModule} from "../pages/e-commerce/e-commerce.module";

import 'style-loader!leaflet/dist/leaflet.css';
import {ActivatedRoute, Router} from "@angular/router";
import {SchemaService} from "../services/schema.service";
import {ConfigurationService} from "../services/configuration.service";
import {FormBuilder, FormControl, FormGroup} from "@angular/forms";
import {Options} from "ng5-slider";
import * as d3 from "d3";
import {GeoDataService} from "../services/geo-data.service";
import {MapService} from "../services/map.service";
import {GeocodingService} from "../services/geocoding.service";
import {DataService} from "../services/data.service";
import {legendColor} from "d3-svg-legend";
import {Widget} from "../widget";
import {EncrDecrService} from "../services/encr-decr.service";
import {BarChartComponent} from "../pages/graphics/bar-chart/bar-chart.component";
import {TreemapChartComponent} from "../pages/graphics/treemap-chart/treemap-chart.component";
import { Marker } from '../marker';
import {Subscription} from "rxjs";
import {DragulaService} from "ng2-dragula";
import {ToastrComponent} from "../pages/modal-overlays/toastr/toastr.component";
import {LineChartComponent} from "../pages/graphics/line-chart/line-chart.component";
import {CalendarComponent} from "../pages/graphics/calendar/calendar.component";
import {Http} from "@angular/http";
import {DialogEquipesComponent, MunElement} from "../pages/modal-overlays/dialogEquipes/dialog-equipes.component";

interface WidgetType {
   key: string;
   type: string;
   widget: Widget;
}

interface DimConstraints {
   [key: string]: string;
}

@Component({
  selector: 'app-demo3',
  templateUrl: './demo3.component.html',
  styleUrls: ['./demo3.component.scss']
})

@NgModule({
   imports: [
      ThemeModule,
      NbCardModule,
      NbUserModule,
      NbButtonModule,
      NbIconModule,
      NbTabsetModule,
      NbSelectModule,
      NbListModule,
      ChartModule,
      NbProgressBarModule,
      NgxEchartsModule,
      NgxChartsModule,
      LeafletModule,
      ECommerceModule
   ],
   declarations: [
   ],
   exports: [
   ]
})
export class Demo3Component implements OnInit, AfterViewInit {

   @ViewChild('container', { read: ViewContainerRef, static: true }) container: ViewContainerRef;
   @ViewChild('calendarContainer', { read: ViewContainerRef, static: true }) calendarContainer: ViewContainerRef;
   //@ViewChild('containerlarge', { read: ViewContainerRef, static: true }) containerLarge: ViewContainerRef;
   @ViewChild('mapwidgets', {static: true}) mapwidgets: ElementRef;

   private widgets: Array<WidgetType> = [];
   private calendarWidget: WidgetType;

   private temporal: DimConstraints = {};
   private bar_categorical: DimConstraints = {};
   private treemap_categorical: DimConstraints = {};

   private title = 'app';
   private marker: Marker;

   dataset: any;

   registersLabel: string;
   have_categorical_dominance_map: boolean
   dominance_dim_label: string

   options: FormGroup;

   private aggr: string;

   bar_categorical_restrictions = {
      sus_cont_ciap: [
         // {minValue: 3, maxValue: 5, count: 0, maxCount: 0, filter: '-', viewValue: ' de semanas de gestação', dimName: 'semanas_gestacional'},
         // {minValue: 1, maxValue: 5, count: 0, maxCount: 0, filter: '-', viewValue: ' de qtd. de CIAPs', dimName: 'qtd_ciaps'},
      ],
      sus_ciap: [],
      example: [],
      spotifyvis: [],
      qdscovid_registers: [],
      qdscovid_symptoms: [],
      qdscovid_conditions: [],
   };

   notRefreshTreemapGraphs = [];

   current_modal = null;
   project_hash_value = "";
   key_encr = "combaftp";

   optionsCategoricalRestrictions: Options = {
      floor: 0,
      ceil: 8,
      showTicks: true,
      showSelectionBar: true,
      translate: (value: number): string => {
         if (value === 0) {
            return '0';
         }
         else {
            return '10' + value.toString().sup();
         }
      }
   };

   setCategoricalRestrictions(event, entry) {
       this.loadWidgetsData();
   }

   color: any;

   aggr_map = {
      'count': {
         key: 'count',
         sufix: undefined,
         label: 'Contagem',
         formatter: d3.format('.2s')
      }
   };

   currRegion = 0;

   info_name = '';
   info_events = [0, 0];
   info_pop = [0, 0];
   info_den = [0, 0];
   info_cat = ['', 0.0, 0.0, 0.0]

   ableToGetData = true;

   maximumPop = 0;
   currentZoom = 0;
   maximumZoom = 0;

   range_map = {
      'normal': ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#081d58'],
      'normal_2': ['#ffffd9','#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#253494','#081d58', '#cb181d', '#67000d'],
      'custom_paired': ['#1f78b4', '#33a02c', '#e31a1c', '#ff7f00', '#6a3d9a', '#b15928', '#a6cee3', '#b2df8a', '#fb9a99', '#fdbf6f', '#cab2d6', '#ffff99'],
      'category10': ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
      'category20': ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', '#8c564b', '#c49c94' , '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5'],
      'category20c': ['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#e6550d', '#fd8d3c', '#fdae6b', '#fdd0a2', '#31a354', '#74c476', '#a1d99b', '#c7e9c0', '#756bb1', '#9e9ac8', '#bcbddc', '#dadaeb', '#636363', '#969696', '#bdbdbd', '#d9d9d9'],
   }

   color_map = {
      'normal': (dim) => d3.scaleQuantile<string>()
         .domain(this.domainQuantile(this.geo.json_min_max.get(dim), this.range_map.normal_2.length))
         //.domain(this.geo.json_min_max.get(dim))
         .range(this.range_map.normal_2),

      'normal_pop': (dim) => d3.scaleQuantile<string>()
         .domain(this.domainQuantile(this.geo.json_min_max_pop.get(dim), this.range_map.normal_2.length))
         //.domain(this.geo.json_min_max_pop.get(dim))
         .range(this.range_map.normal_2),

      'normal_den': (dim) => d3.scaleQuantile<string>()
         .domain(this.domainOutlier(this.geo.json_min_max_den.get(dim), this.range_map.normal.length))
         .range(this.rangeOutlier(this.geo.json_min_max_den.get(dim), this.range_map.normal)),

      'normal_cat': d3.scaleOrdinal()
         .domain(this.domainCategorical())
         .range(this.rangeColorCategorical()),

      'ryw': (count) => {
         const lc = Math.log(count) / Math.log(100);

         const r = Math.floor(256 * Math.min(1, lc));
         const g = Math.floor(256 * Math.min(1, Math.max(0, lc - 1)));
         const b = Math.floor(256 * Math.min(1, Math.max(0, lc - 2)));

         return 'rgba(' + r + ',' + g + ',' + b + ',' + 0.75 + ')';
      }
   };

   aggr_values = [
      { value: 'count', viewValue: 'Contagem' }
   ];

   health = {
      visible: true
   };

   population = {
      visible: true
   };

   density = {
      visible: true
   };

   categorical = {
      visible: true
   };

   optionsRegions = [{value: 0, label: "Estados"}, {value:1, label: "Municípios"}];

   radioGroupValue = 0;

   private MiddleRegionLayer: L.GridLayer;
   private BottomRegionLayer: L.GridLayer;
   private TopRegionLayer: L.GridLayer;

   private BottomPopRegionLayer: L.GridLayer;
   private TopPopRegionLayer: L.GridLayer;

   private BottomDenRegionLayer: L.GridLayer;
   private TopDenRegionLayer: L.GridLayer;

   private BottomCatRegionLayer: L.GridLayer;
   private TopCatRegionLayer: L.GridLayer

   private layersControl;
   private toastrComponent;

   domainQuantile([min, max], num) {
      let base = Math.pow(max/min, 1/(num-1));
      let exp = Math.log(min)/Math.log(base);
      let domain = [];
      for (var i = 0; i < num; i++) {
         domain[i] = Math.pow(base, exp) * Math.pow(base, i);
      }
      return domain;
   }
   domainOutlier([min, max, q1, q3, iqr], num) {
      num = num + 1;
      let domain = [];
      let lower, upper;
      if (min < q1 - 3 * iqr) {
         lower = q1 - 1.5 * iqr;
         domain.push(min);
         domain.push(q1 - 3 * iqr);
      }
      else if (min < q1 - 1.5 * iqr) {
         lower = q1 - 1.5 * iqr;
         domain.push(min);
      }
      else {
         lower = min;
      }

      if (max > q3 + 3 * iqr) {
         upper = q3 + 1.5 * iqr;
      }
      else if (max > q3 + 1.5 * iqr) {
         upper = q3 + 1.5 * iqr;
      }
      else {
         upper = max;
      }

      for (var i = 0; i < num; i++) {
         domain.push(lower + (upper - lower)/(num - 1) * i);
      }

      if (max > q3 + 3 * iqr) {
         domain.push(q3 + 3 * iqr);
         domain.push(max);
      }
      else if (max > q3 + 1.5 * iqr) {
         domain.push(max);
      }
      return domain;
   }
   rangeOutlier([min, max, q1, q3, iqr], range) {
      let newRange = range;
      if (min < q1 - 3 * iqr) {
         newRange = ['#67000d', '#cb181d'].concat(newRange);
      }
      else if (min < q1 - 1.5 * iqr) {
         newRange = ['#cb181d'].concat(newRange);
      }

      if (max > q3 + 3 * iqr) {
         newRange = newRange.concat(['#cb181d', '#67000d']);
      }
      else if (max > q3 + 1.5 * iqr) {
         newRange = newRange.concat(['#cb181d']);
      }
      return newRange;
   }

   domainCategorical() {
      if (this.dataset == undefined) {
         return []
      }

      return this.dataset.aliases[this.dataset['dominance_dim_map']]
   }

   rangeColorCategorical () {
      if (this.domainCategorical().length <= 10) {
         return this.range_map.category10;
      }
      return this.range_map.category20;
   }

   population_code(feature, region?) {
      if (region == undefined) {
         region = this.currRegion;
      }
      switch (region) {
         case 0:
            return feature.properties.population;
         case 1:
            return feature.properties.population;
         default:
            return feature.properties.population;
      }
   }

   getCountPop(feature?) {
      let self = this;

      if (self.geo.json_value.get(this.getCurrRegion()) == undefined) {
         return this.maximumPop;
      }

      if (self.geo.json_value.get(this.getCurrRegion()).size == 0) {
         return this.maximumPop;
      }

      if (feature) {
         return this.population_code(feature);
      }
      let selected = this.geo.json_selected.get(this.getCurrRegion());

      if (!selected || selected.size === 0) {
         return this.maximumPop;
      }
      let values = 0;

      selected.forEach((value, key, map) => {
         if (value) {
            values += this.population_code(key);
         }
      });

      if (values == 0) {
         return this.maximumPop;
      }

      return values;
   }


   region_name(feature, region?) {
      if (region == undefined) {
         region = this.currRegion;
      }
      switch (region) {
         case 0:
            return feature.properties.NOME_UF;
         case 1:
            return feature.properties.right_name;
         default:
            return feature.properties.NOME_UF;
      }
   }
   region_code(feature, region?) {
      if (region == undefined) {
         region = this.currRegion;
      }
      switch (region) {
         case 0:
            return feature.properties.UF_05;
         case 1:
            return feature.properties.GEOCODIGO;
         default:
            return feature.properties.UF_05;
      }
   }
   getRegionConst(feature?) {
      let self = this;
      if (feature) {
         let r_code = String(this.region_code(feature));
         let value_region = self.geo.json_value.get(this.getCurrRegion()).get(r_code.toUpperCase());
         if (value_region != undefined) {
            return '/const=' + this.getCurrRegion() + '.values.(' + value_region[0] + ')';
         }
      }

      let output = "";
      let idx = 0;
      for (const dim of this.schemaService.getGlobal()["regionCategoricalDimension"]) {
         if (self.geo.json_value.get(dim) == undefined) {
            idx += 1;
            continue;
         }

         if (self.geo.json_value.get(dim).size == 0) {
            idx += 1;
            continue;
         }

         let selected = this.geo.json_selected.get(dim);

         if (!selected || selected.size === 0) {
            idx += 1;
            continue;
         }

         let valid = false;
         let values = '/const=' + dim + '.values.(';

         selected.forEach((value, key, map) => {
            if (value) {
               let r_code_2 = String(this.region_code(key, idx));
               let value_one_selected = self.geo.json_value.get(dim).get(r_code_2.toUpperCase());
               if (value_one_selected != undefined) {
                  valid = true;
                  values += + value_one_selected[0] + ':';
               }
            }
         });

         values = values.substr(0, values.length - 1);
         values += ')';
         output += valid ? values : '';

         idx += 1;
      }
      return output;
   }
   getCurrentFeature() {
      return this.geo.json_curr.get(this.getCurrRegion());
   }

   /*BAG = "SORTABLE_COMPONENT";*/
   /*subs = new Subscription();*/

   ibge2Equipe = new Map();

  constructor(
     private geo: GeoDataService,
     private mapService: MapService,
     private geocodingService: GeocodingService,
     private configService: ConfigurationService,
     private schemaService: SchemaService,
     private activatedRoute: ActivatedRoute,
     private dataService: DataService,
     private formBuilder: FormBuilder,
     private http: Http,
     private componentFactory: ComponentFactoryResolver,
     private renderer2: Renderer2,
     private encrDecrService: EncrDecrService,
     private windowService: NbWindowService,
     private dragulaService: DragulaService,
     private router: Router,
     private toastrService: NbToastrService,
     private dialogService: NbDialogService
  ) {
     /*this.subs.add(dragulaService.drop(this.BAG)
        .subscribe(({ el }) => {
           // @ts-ignore
           let container_size = el.parentNode.getAttribute('image-size');
           // @ts-ignore
           let container_dim = el.getAttribute('dimension');
           if(container_size=='large') el.setAttribute('class', this.getComponentSize(container_dim/!*, 0*!/));
           else el.setAttribute('class', this.getComponentSize(container_dim/!*, this.dataset['qtd_graphics_small']*!/));
           this.loadWidgetsData();
        })
     );*/
     this.toastrComponent = new ToastrComponent(toastrService);
  }

   getComponentSize(dim) {
      let size = 24;
      if (this.dataset['graphics_small'].includes(dim)) size /= this.dataset['qtd_graphics_small'];
      else size /= this.dataset['qtd_graphics_large'];
      return 'col-'+(size*2).toString() + ' ' + 'col-sm-'+(size*2).toString() + ' ' + 'col-md-'+(size*2).toString() + ' ' + 'col-lg-'+(size*2).toString() + ' ' + 'col-xl-'+size.toString();
      // return 'col-xl-'+size.toString();
   }

   setAggr() {
      this.updateAggr();
      this.loadWidgetsData();
      this.setMapData();
   }

   getPayloadInfo(key: string) {
      return d3.format('.2f')(this.dataset.payloadValues[this.options.get('payload').value][this.options.get('aggr').value][key]);
   }
   updateAggr() {
      const type = this.options.get('aggr').value;

      this.color = this.color_map['normal'];

      this.aggr = '/aggr=' + this.aggr_map[type].key;

      if (this.aggr_map[type].sufix !== undefined) {
         this.aggr += '.' + this.options.get('payload').value + this.aggr_map[type].sufix;
      }

      if (type === 'cdf' || type === 'quantile') {
         this.aggr += '.(' + this.getPayloadInfo('value') + ')';
      }
   }
   getMapPromises = () => {
      let self = this;

      const constrainsts = self.getBarCategoricalConst() +
         self.getTreemapCategoricalConst() +
         self.getTemporalConst() +
         self.getRegionConst();

      let promises = [];

      let getPromise = (dim) => {
         return new Promise((resolve) => {
            let query = '';
            query = '/query' +
               '/dataset=' + self.dataset.datasetName +
               this.getAggr() +
               constrainsts +
               '/const=' + dim + '.values.(all)/group=' + dim;

            // reset min_max values
            self.geo.json_min_max.set(dim, [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]);
            self.geo.json_min_max_pop.set(dim, [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]);
            self.geo.json_min_max_den.set(dim, [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]);

            self.dataService.query(query).subscribe(response => {
               let value = response[0];

               if (value.length) {
                  let curr_minmax = self.geo.json_min_max.get(dim);
                  self.geo.json_value.set(dim, new Map());
                  self.geo.json_value_cat.set(dim, new Map())

                  value.map((el) => {
                     if (!isNaN(el[1])) {
                        curr_minmax[0] = Math.min(curr_minmax[0], el[1]);
                        curr_minmax[1] = Math.max(curr_minmax[1], el[1]);

                        self.geo.json_value.get(dim).set(this.dataset.aliases[dim][el[0]].toUpperCase(), [el[0], el[1]]);
                        self.geo.json_value_cat.get(dim).set(this.dataset.aliases[dim][el[0]].toUpperCase(), [el[0], NaN, NaN, NaN, NaN])
                     }
                  });

                  self.geo.json_min_max.set(dim, curr_minmax);
               }

               let densities:Array<number> = [];
               let curr_minmax = self.geo.json_min_max_pop.get(dim);
               L.geoJSON(this.geo.json.get(self.getCurrRegion()), {
                  onEachFeature: (feature, layer) => {
                     let r_code = String(this.region_code(feature));
                     let nume = self.geo.json_value.get(dim).get(r_code.toUpperCase());
                     let deno = this.population_code(feature);
                     if (nume != undefined) {
                        densities.push((nume[1] / deno) * 1000000);

                        if (deno < curr_minmax[0])
                           curr_minmax[0] = deno;
                        if (deno > curr_minmax[1])
                           curr_minmax[1] = deno;
                     }
                  }
               });
               self.geo.json_min_max_pop.set(dim, curr_minmax);

               densities = densities.sort((a, b) => a - b);
               let q1, q3;
               if (densities.length % 2 != 0) {
                  q1 = this.median(densities.slice(0, Math.floor(densities.length / 2)));
                  q3 = this.median(densities.slice(Math.floor(densities.length / 2) + 1));
               }
               else {
                  q1 = this.median(densities.slice(0, densities.length / 2));
                  q3 = this.median(densities.slice(densities.length / 2));
               }

               if (q1 != undefined && q3 != undefined) {
                  let iqr = q3 - q1;
                  self.geo.json_min_max_den.set(dim, [densities[0], densities[densities.length - 1], q1, q3, iqr])
               }

               if (this.have_categorical_dominance_map) {
                  let dominance_dim_map = this.dataset['dominance_dim_map']
                  var indexs = Array()
                  var requests = Array()

                  for (var i = 0; i < this.dataset.aliases[dominance_dim_map].length; i++) {
                     let query = '/query' +
                        '/dataset=' + self.dataset.datasetName +
                        this.getAggr() +
                        constrainsts +
                        '/const=' + dominance_dim_map + '.values.(' + i + ')' +
                        '/const=' + dim + '.values.(all)/group=' + dim;

                     indexs.push(i)
                     requests.push(query)
                  }

                  self.dataService.queryMultiple(indexs, requests).subscribe(responseList => {
                     responseList.forEach((value) => {
                        let valueCat = value[0]
                        let index = value['index']

                        if (valueCat.length) {
                           valueCat.map((el) => {
                              if (!isNaN(el[1])) {
                                 let region = self.geo.json_value_cat.get(dim).get(this.dataset.aliases[dim][el[0]].toUpperCase())

                                 var region_per = NaN
                                 var region_tot = NaN

                                 if (region != undefined) {
                                    region_per = region[1]
                                    region_tot = region[3]
                                 }

                                 if (self.geo.json_value_cat.get(dim).get(this.dataset.aliases[dim][el[0]].toUpperCase()) == undefined) {
                                    self.geo.json_value_cat.get(dim).set(this.dataset.aliases[dim][el[0]].toUpperCase(), [el[0], NaN, NaN, NaN, NaN])
                                 }

                                 if (isNaN(region_per)) {
                                    self.geo.json_value_cat.get(dim).get(this.dataset.aliases[dim][el[0]].toUpperCase())[1] = el[1]
                                    self.geo.json_value_cat.get(dim).get(this.dataset.aliases[dim][el[0]].toUpperCase())[2] = this.dataset.aliases[dominance_dim_map][index]
                                    self.geo.json_value_cat.get(dim).get(this.dataset.aliases[dim][el[0]].toUpperCase())[4] = index
                                 }
                                 else {
                                    if (el[1] > region_per) {
                                       self.geo.json_value_cat.get(dim).get(this.dataset.aliases[dim][el[0]].toUpperCase())[1] = el[1]
                                       self.geo.json_value_cat.get(dim).get(this.dataset.aliases[dim][el[0]].toUpperCase())[2] = this.dataset.aliases[dominance_dim_map][index]
                                       self.geo.json_value_cat.get(dim).get(this.dataset.aliases[dim][el[0]].toUpperCase())[4] = index
                                    }
                                 }

                                 if (isNaN(region_tot)) {
                                    self.geo.json_value_cat.get(dim).get(this.dataset.aliases[dim][el[0]].toUpperCase())[3] = el[1]
                                 }
                                 else {
                                    self.geo.json_value_cat.get(dim).get(this.dataset.aliases[dim][el[0]].toUpperCase())[3] += el[1]
                                 }
                              }
                           });
                        }
                     })

                     resolve(true)
                  })
               }
               else {
                  resolve(true)
               }
            });
         });
      };

      // wait for all promises fineshes and then ...
      promises.push(getPromise(self.getCurrRegion()));

      return promises;
   };

   addLabel(feature){
      let self = this;
      let label = feature.properties.NOME_UF;
      let desc = this.optionsRegions[0].label;
      if(this.schemaService.global['regionCategoricalDimension'][1] == this.getCurrRegion()){
         label = feature.properties.right_name;
         desc = this.optionsRegions[1].label;
      }
      let labelParent = d3.select('#filter'+this.getCurrRegion());
      let classSpan = 'nb-badge-custom';
      if(labelParent.empty()){
         /*if(d3.selectAll(".filter-field").size()%2==1){
            classSpan = 'nb-badge-gray';
         }*/
         d3.select('#filters')
            .append('div').attr('id', 'filter'+this.getCurrRegion())//.attr('color-class', classSpan).attr('class', 'filter-field')
            .append('text').text(desc + ':\ ').style('color', '#717c95').style('padding', '0.25rem 0.05rem');
      }
      const filter = d3.select('#filter'+this.getCurrRegion()).append('span')
         // .attr('class', d3.select('#filter'+this.getCurrRegion()).attr('color-class'))
         .attr('class', classSpan)
         .attr('id', this.getCurrRegion()+feature.properties.GEOCODIGO).text(label+'\u00A0\u00A0');
      filter.append('svg').attr('width', 10).attr('height', 10)
         .on('mouseover', function(){
            d3.select(this).style('cursor', 'pointer');
         })
         .on('mouseout', function(){
            d3.select(this).style('cursor', 'default');
         })
         .on('click', function () {
            self.mapService.map.eachLayer(function (layer) {
               if(typeof layer.feature !== 'undefined'){
                  if(self.geo.json_selected.get(self.getCurrRegion()).get(feature) && layer.feature == feature){
                     layer.fireEvent('click');
                  }
               }
            });
            self.removeLabel(feature);
         }).append('g')
         .append('path').attr('d', 'M 0 0 L 9 9 M 0 9 L 9 0').attr('stroke','white').attr('stroke-width', 2);
   }
   removeLabel(feature) {
      d3.select('#' + this.getCurrRegion() + feature.properties.GEOCODIGO).remove();
      let labelParent = d3.select('#filter' + this.getCurrRegion() + ' span');
      if (labelParent.empty()) {
         d3.select('#filter' + this.getCurrRegion()).remove();
      }
   }

   loadLayer() {
      let self = this;
      let promises = self.getMapPromises();

      const range = this.domainCategorical();
      self.color_map["normal_cat"] = d3.scaleOrdinal()
         .domain(range)
         .range(self.rangeColorCategorical());

      Promise.all(promises).then(() => {
         let getLayerColor = (feature, dim, key) => {
            let r_code = String(this.region_code(feature));
            let value = undefined;
            let relative_opacity = 1.0

            if (key == "curr")
               value = self.geo.json_value.get(dim).get(r_code.toUpperCase());
            else if (key == "curr_pop") {
               let nume = self.geo.json_value.get(dim).get(r_code.toUpperCase());
               let deno = this.population_code(feature);
               value = (nume == undefined) ? undefined : deno;
            }
            else if (key == "curr_den") {
               let nume = self.geo.json_value.get(dim).get(r_code.toUpperCase());
               let deno = this.population_code(feature);
               value = (nume == undefined) ? undefined : ((nume[1] / deno) * 1000000);
            }
            else if (key == "curr_cat") {
               let values = self.geo.json_value_cat.get(dim).get(r_code.toUpperCase())
               if (values != undefined) {
                  let max = values[1]
                  let predominant = values[2]
                  let total = values[3]

                  value = predominant
                  // value = values[4]
                  relative_opacity = (max / total ) * 2

                  if (relative_opacity >= 0.75) relative_opacity = 1.0
                  else if (relative_opacity >= 0.5) relative_opacity = 0.75
                  else if (relative_opacity >= 0.25) relative_opacity = 0.5
                  else relative_opacity = 0.25
               }
            }
            let style = <any>{};
            if (value != undefined) {
               style.color = 'black';
               style.weight = 0.2;
               style.opacity = 0.70;
               style.fillOpacity = 0.70;

               if (key == "curr")
                  style.fillColor = self.color(dim)(value[1]);
               else if (key == "curr_pop")
                  style.fillColor = self.color_map["normal_pop"](dim)(value);
               else if (key == "curr_den")
                  style.fillColor = self.color_map["normal_den"](dim)(value);
               else if (key == "curr_cat") {
                  // style.fillColor = self.color_map["normal_cat"](colorsSorted[mapCatToInt[value]])
                  // style.fillColor = self.color_map["normal_cat"](colorsSorted[value])
                  style.fillColor = self.color_map["normal_cat"](value)
                  style.opacity = 0.90 * relative_opacity
                  style.fillOpacity = 0.90 * relative_opacity
               }
               else
                  style.fillColor = 'rgba(0,0,0,0)';
            }
            else {
               style.fillColor = 'rgba(0,0,0,0)';
               style.color = 'black';
               style.weight = 0.2;
               style.opacity = 0.0;
               style.fillOpacity = 0.0;
            }

            // selected layer
            if (self.geo.json_selected.get(dim).get(feature)) {
               style.weight = 4.0;
               style.fillColor = 'darkorange';
            }

            return style;
         };

         let layerOnMouseOver = (feature, el, dim, key) => {
            if (!self.geo.json_value || !self.geo.json_value.get(dim) || !self.ableToGetData) {
               return;
            }

            // already selected feature
            if (self.geo.json_curr.get(dim) !== feature) {
               // update info on mousemove
               self.geo.json_curr.set(dim, feature);
               self.updateInfo();
            }

            let style = getLayerColor(feature, dim, key);
            style.weight = 4.0;
            style.opacity = 1.0;

            el.target.setStyle(style);

            return style;
         };

         let layerOnMouseOut = (feature, el, dim, key) => {
            if (!self.geo.json_value || !self.geo.json_value.get(dim) || !self.ableToGetData) {
               return;
            }

            let style = getLayerColor(feature, dim, key);
            el.target.setStyle(style);

            return style;
         };

         let layerOnMouseClick = (feature, el, dim, key) => {
            if (!self.geo.json_value || !self.geo.json_value.get(dim)) {
               return;
            }
            this.notRefreshTreemapGraphs = [];

            // swith selected
            if (self.geo.json_selected.get(dim).get(feature)) {
               self.geo.json_selected.get(dim).set(feature, false);
               self.removeLabel(feature);
            }
            else {
               self.geo.json_selected.get(dim).set(feature, true);
               self.addLabel(feature);
            }

            let style = getLayerColor(feature, dim, key);
            style.weight = 4.0;

            el.target.setStyle(style);
            self.loadWidgetsData();

            return style;
         };

         self.updateAggr();

         self.health.visible = true;
         self.population.visible = false;
         self.density.visible = false;
         self.categorical.visible = false;

         self.loadLegend(self.getCurrRegion());

         let getLayerByKey = (key) => {
            if (key == 'curr' || key == 'curr_pop' || key == "curr_den" || key == 'curr_cat') {
               return self.getCurrRegion();
            }
            else {
               return self.getPrevRegion();
            }
         };

         let getLayer = (key) => {
            return L.geoJSON(this.geo.json.get(getLayerByKey(key)), {
               keepBuffer: 2,
               updateInterval: 40,
               updateWhenIdle: true,
               updateWhenZooming: false,

               style: (feature) => {
                  if (key == 'prev' || key == "prev_pop" || key == "prev_den" || key == 'prev_cat') {
                     return { fillColor: 'rgba(0,0,0,0)', color: 'black', weight: 2.0, opacity: 1.0, fillOpacity: 0.0 };
                  }
                  else {
                     return getLayerColor(feature, self.getCurrRegion(), key);
                  }
               },
               onEachFeature: (feature, layer) => {
                  if (key == 'curr' || key == 'curr_pop' || key == "curr_den" || key === 'curr_cat') {
                     layer.on({
                        mouseover: (el) => layerOnMouseOver(feature, el, self.getCurrRegion(), key),
                        mouseout: (el) => layerOnMouseOut(feature, el, self.getCurrRegion(), key),
                        click: (el) => layerOnMouseClick(feature, el, self.getCurrRegion(), key)
                     });
                  }
               }
            });
         };

         if (this.BottomRegionLayer) this.mapService.map.removeLayer(this.BottomRegionLayer);
         if (this.TopRegionLayer) this.mapService.map.removeLayer(this.TopRegionLayer);

         if (this.BottomPopRegionLayer) this.mapService.map.removeLayer(this.BottomPopRegionLayer);
         if (this.TopPopRegionLayer) this.mapService.map.removeLayer(this.TopPopRegionLayer);

         if (this.BottomDenRegionLayer) this.mapService.map.removeLayer(this.BottomDenRegionLayer);
         if (this.TopDenRegionLayer) this.mapService.map.removeLayer(this.TopDenRegionLayer);

         if (this.BottomCatRegionLayer) this.mapService.map.removeLayer(this.BottomCatRegionLayer)
         if (this.TopCatRegionLayer) this.mapService.map.removeLayer(this.TopCatRegionLayer)

         this.BottomRegionLayer = getLayer('prev');
         this.TopRegionLayer = getLayer('curr');
         this.TopRegionLayer.on('add', this.onRegionAdd, this);
         this.TopRegionLayer.on('remove', this.onRegionRemove, this);

         let agiradom = L.layerGroup([this.BottomRegionLayer, this.MiddleRegionLayer, this.TopRegionLayer], {
            zIndex: 1000
         }).addTo(this.mapService.map);

         this.BottomPopRegionLayer = getLayer('prev_pop');
         this.TopPopRegionLayer = getLayer('curr_pop');
         this.TopPopRegionLayer.on('add', this.onRegionPopAdd, this);
         this.TopPopRegionLayer.on('remove', this.onRegionPopRemove, this);

         let map_population = L.layerGroup([this.BottomPopRegionLayer, this.MiddleRegionLayer, this.TopPopRegionLayer], {
            zIndex: 1000
         });

         this.BottomDenRegionLayer = getLayer('prev_den');
         this.TopDenRegionLayer = getLayer('curr_den');
         this.TopDenRegionLayer.on('add', this.onRegionDenAdd, this);
         this.TopDenRegionLayer.on('remove', this.onRegionDenRemove, this);

         let map_density = L.layerGroup([this.BottomDenRegionLayer, this.MiddleRegionLayer, this.TopDenRegionLayer], {
            zIndex: 1000
         });

         this.BottomCatRegionLayer = getLayer('prev_cat');
         this.TopCatRegionLayer = getLayer('curr_cat');
         this.TopCatRegionLayer.on('add', this.onRegionCatAdd, this);
         this.TopCatRegionLayer.on('remove', this.onRegionCatRemove, this);

         let map_category = L.layerGroup([this.BottomCatRegionLayer, this.MiddleRegionLayer, this.TopCatRegionLayer], {
            zIndex: 1000
         });

         let overlay_maps = {}

         overlay_maps[this.registersLabel] = agiradom
         overlay_maps["População"] = map_population
         overlay_maps["Densidade/1M"] = map_density

         if (this.have_categorical_dominance_map) {
            overlay_maps[this.dominance_dim_label] = map_category
         }

         if (this.layersControl) this.layersControl.remove(this.mapService.map);
         this.layersControl = L.control.layers(overlay_maps, null, {
            collapsed: false,
            hideSingleBase: true,
            position: 'topleft',
            autoZIndex: false
         }).addTo(this.mapService.map);

         this.mapService.map.on('move', this.onMapMoveStart, this);
         this.mapService.map.on('moveend', this.onMapMoveEnd, this);
         this.mapService.map.on('zoomend', this.onMapZoomEnd, this);
      });


      self.mapService.map.on('baselayerchange', function() {
         self.mapService.map.eachLayer(function (layer) {
            if(typeof layer.feature !== 'undefined'){
               if(self.geo.json_selected.get(self.getCurrRegion()).get(layer.feature)){
                  layer.fireEvent('mouseover');
                  layer.fireEvent('mouseout');
               }
            }
         });
      });

   }


   getCountMaxPop() {
      let features = this.geo.json.get(this.getCurrRegion()).features;

      if (!features || features.length === 0) {
         return 0;
      }
      let values = 0;

      features.forEach((value, key, map) => {
         if (value) {
            values += this.population_code(value);
         }
      });

      return values;
   }
   loadMapCard() {
      this.currentZoom = this.mapService.map.getZoom();
      this.maximumZoom = this.mapService.map.getMaxZoom();
      this.maximumPop = this.getCountMaxPop();
   }

   setMapRegion(event) {
      this.currRegion = event;
      this.setMapData();
   }

   clearConstrains() {
      this.project_hash_value = "";
      this.temporal = {};
      this.bar_categorical = {};
      this.treemap_categorical = {};
      this.notRefreshTreemapGraphs = [];

      for(let dimTemp in this.dataset.temporalDimension) {
         this.setTemporalData(dimTemp,
            [this.dataset.temporalDimension[dimTemp].lower, this.dataset.temporalDimension[dimTemp].upper]
         );
      }

      for (const dim of this.schemaService.getGlobal()["regionCategoricalDimension"]) {
         this.geo.json_selected.set(dim, new Map());
      }
      for (const ref of this.widgets) {
         if (ref.type === 'bar_categorical') {
            (<BarChartComponent>ref.widget).clearSelectedElts();
         }
         else if (ref.type === 'treemap_categorical') {
            (<TreemapChartComponent>ref.widget).clearSelectedElts();
         }
      }
      this.bar_categorical_restrictions[this.dataset.datasetName].forEach((entry) => {
         entry.filter = '-';
      });
      this.setAggr();
      d3.select('#filters').selectAll("*").remove();
      this.radioGroupValue = 0;
      this.setMapRegion(this.radioGroupValue);
   }

   getBarCategoricalConst(filter?: string) {
      let constrainsts = '';
      for (const key of Object.keys(this.bar_categorical)) {
         if (filter && key === filter) {
            continue;
         }
         else {
            constrainsts += this.bar_categorical[key];
         }
      }

      if (filter !== undefined) {
         constrainsts += '/const=' + filter + '.values.(all)';
      }
      return constrainsts;
   }

   getTreemapCategoricalConst(filter?: string) {
      let constrainsts = '';
      for (const key of Object.keys(this.treemap_categorical)) {
         if (filter && key === filter) {
            continue;
         }
         else {
            constrainsts += this.treemap_categorical[key];
         }
      }

      if (filter !== undefined) {
         constrainsts += '/const=' + filter + '.values.(all)';
      }
      return constrainsts;
   }

   getTemporalConst() {
      let constrainsts = '';
      for (const key of Object.keys(this.temporal)) {
         constrainsts += this.temporal[key];
      }

      return constrainsts;
   }

   setTemporalData = (dim: string, interval: Array<string>, notFirstLoad=true) => {

      const values = '/const=' + dim + '.interval.(' + interval[0] + ':' + interval[1] + ')';
      this.temporal[dim] = values;

      if(notFirstLoad){
         // this.updateColorScale();
         this.loadWidgetsData();
         this.setMapData();
      }
   }

   setRegionData = (latlng: any, zoom: number): void => {
   }

   updateProjectHashValue() {
      let regional: DimConstraints = {};
      for (const dim of this.schemaService.getGlobal()["regionCategoricalDimension"]) {
         let selected = this.geo.json_selected.get(dim);

         if (!selected || selected.size === 0) {
            continue;
         }
         let valid = false;
         let values = '/const=' + dim + '.values.(';

         selected.forEach((value, key, map) => {
            if (value) {
               let r_code_2 = String(this.region_code(key));
               let value_one_selected = this.geo.json_value.get(this.getCurrRegion()).get(r_code_2.toUpperCase());
               if (value_one_selected != undefined) {
                  valid = true;
                  values += + value_one_selected[0] + ':';
               }
            }
         });

         values = values.substr(0, values.length - 1);
         values += ')';

         regional[dim] = valid ? values : '';
      }

      const data = Object.assign({}, this.temporal, this.bar_categorical, this.treemap_categorical);

      this.project_hash_value = this.encrDecrService.set(this.key_encr, JSON.stringify(data));
   }

   loadWidgetsData() {
      this.updateInfo();
      this.updateProjectHashValue();
      // console.log(query);
      let color = 'normal';

      for (const ref of this.widgets) {
         if (ref.type === 'bar_categorical') {
            ref.widget.setFormatter(this.getFormatter());

            this.bar_categorical_restrictions[this.dataset.datasetName].forEach((entry) => {
               if (entry.dimName == (<BarChartComponent>ref.widget).getDim()) {
                  //(<BarChartComponent>ref.widget).setHaveMinSlider(true);
                  if (entry.minValue === 0) {
                     (<BarChartComponent>ref.widget).setMinValue(entry.minValue);
                  }
                  else {
                     (<BarChartComponent>ref.widget).setMinValue(Math.pow(10, entry.minValue));
                  }
                  if (entry.maxValue === 0) {
                     (<BarChartComponent>ref.widget).setMaxValue(entry.maxValue);
                  }
                  else {
                     (<BarChartComponent>ref.widget).setMaxValue(Math.pow(10, entry.maxValue));
                  }
               }
            });

            const constrainsts = this.getBarCategoricalConst(ref.key) + this.getTreemapCategoricalConst() +
               this.getTemporalConst() +
               this.getRegionConst();
            ref.widget.setNextTerm(
               '/query/dataset=' + this.dataset.datasetName +
               this.getAggr() +
               constrainsts +
               '/group=' + ref.key
            );
         }
         else if (ref.type === 'treemap_categorical') {
            let temp = this.notRefreshTreemapGraphs.find(function(element){ return element==ref.key;});
            if(typeof temp === 'undefined'){
               ref.widget.setFormatter(this.getFormatter());

               const constrainsts = this.getBarCategoricalConst() + this.getTreemapCategoricalConst(ref.key) +
                  this.getTemporalConst() +
                  this.getRegionConst();

               ref.widget.setNextTerm(
                  '/query/dataset=' + this.dataset.datasetName +
                  this.getAggr() +
                  constrainsts +
                  '/group=' + ref.key
               );
            }
         }
         else if (ref.type === 'temporal') {
            ref.widget.setFormatter(this.getFormatter());

            const constrainsts = this.getBarCategoricalConst(ref.key) + this.getTreemapCategoricalConst(ref.key) +
               this.getTemporalConst() +
               this.getRegionConst();

            ref.widget.setNextTerm(
               '/query/dataset=' + this.dataset.datasetName +
               this.getAggr() +
               constrainsts +
               '/group=' + ref.key
            );
         }
      }
      this.mapService.map.invalidateSize();
   }

   setBarCategoricalData = (dim: string, selected: Array<string>) => {
      this.notRefreshTreemapGraphs = [];
      if (selected.length === 0) {
         this.bar_categorical[dim] = '';

         this.bar_categorical_restrictions[this.dataset.datasetName].forEach((entry) => {
            if (entry.dimName == dim) {
               entry.filter = '-';
            }
         });
      }
      else {
         let values = '/const=' + dim + '.values.(';
         let valuesFilter = '';
         for (const elt of selected) {
            values += elt + ':';
            valuesFilter += this.dataset.aliases[dim][elt] + ','
         }
         values = values.substr(0, values.length - 1);
         values += ')';
         valuesFilter = valuesFilter.substr(0, valuesFilter.length - 1);

         this.bar_categorical[dim] = values;

         this.bar_categorical_restrictions[this.dataset.datasetName].forEach((entry) => {
            if (entry.dimName == dim) {
               entry.filter = valuesFilter;
            }
         });
      }

      this.loadWidgetsData();
      this.setMapData();
   };

   setCountBarCategoricalData = (dim: string, count: any) => {
      this.bar_categorical_restrictions[this.dataset.datasetName].forEach((entry) => {
         if (entry.dimName == dim) {
            entry.count = count;
         }
      });
   };

   setMaxCountBarCategoricalData = (dim: string, maxCount: any) => {
      this.bar_categorical_restrictions[this.dataset.datasetName].forEach((entry) => {
         if (entry.dimName == dim) {
            entry.maxCount = maxCount;
         }
      });
   };


   setTreemapCategoricalData = (dim: string, selected: Array<string>) => {
      this.notRefreshTreemapGraphs = [];
      let temp = this.notRefreshTreemapGraphs.find(function(element){ return element==dim;});
      if(typeof temp === 'undefined') this.notRefreshTreemapGraphs.push(dim);
      if (selected.length === 0) {
         this.treemap_categorical[dim] = '';
      }
      else {
         let values = '/const=' + dim + '.values.(';
         for (const elt of selected) {
            values += elt + ':';
         }
         values = values.substr(0, values.length - 1);
         values += ')';

         this.treemap_categorical[dim] = values;
      }

      this.loadWidgetsData();
      this.setMapData();
   };

   exportToCsv(){
      const self = this;
      let csvString = 'dimension,atributo,value,porcentagem\r\n';
      this.widgets.forEach(function(e){
         if (e['type'] == 'bar_categorical'){
            let dim = e['key'];
            let total = 0;
            let atributo = typeof(self.dataset['aliases'][dim+'_desc']) === 'undefined'? dim : dim + '_desc';
            e['widget']['data'].forEach(function(d){
               total += d[1];
            });
            e['widget']['data'].forEach(function(d){
               let p = (100*d[1]/total).toFixed(4);
               csvString += '"' + dim + '","' + String(self.dataset['aliases'][atributo][d[0]]) + '"' + ',' + String(d[1])+ ',' + String(p)+'\r\n'
            });
         }
      });
      let blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' });
      let dwldLink = document.createElement("a");
      let url = URL.createObjectURL(blob);
      let isSafariBrowser = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1;
      if (isSafariBrowser) {  //if Safari open in new window to save file with random filename.
         dwldLink.setAttribute("target", "_blank");
      }
      dwldLink.setAttribute("href", url);
      dwldLink.setAttribute("download", self.dataset['datasetLabel'] + ".csv");
      dwldLink.style.visibility = "hidden";
      document.body.appendChild(dwldLink);
      dwldLink.click();
      document.body.removeChild(dwldLink);
   }


   initialize() {
      this.options = this.formBuilder.group({
         // visualization setup
         aggr: new FormControl('count'),
         color: new FormControl(this.dataset.color),
         geometry: new FormControl(this.dataset.geometry),
         geom_size: new FormControl(this.dataset.geometry_size),
         resolution: new FormControl(this.dataset.resolution),

         payload: new FormControl(this.dataset.payloads[0]),
         dataset: new FormControl(this.dataset.datasetName)
      });

      this.updateAggr();

      for(let dimTemp in this.dataset.temporalDimension){
         this.setTemporalData(
            dimTemp,
            [this.dataset.temporalDimension[dimTemp].lower, this.dataset.temporalDimension[dimTemp].upper],
            false
         );
      }

      this.geocodingService.geocode(this.dataset.local)
         .subscribe(location => {
            this.mapService.flyTo(location);
         }, error => console.error(error));

      const viewContainerRef = this.container;

      // clear widgets
      for (let i = 0; i < this.widgets.length; ++i) {
         viewContainerRef.remove(i);
      }

      this.widgets = [];
      let self = this;

      for (const dim of this.dataset.barCategoricalDimension) {
         const component = this.componentFactory.resolveComponentFactory(BarChartComponent);

         let text_css = this.getComponentSize(dim);
         const componentRef = viewContainerRef.createComponent(component);
         const componentInstance = <BarChartComponent>componentRef.instance;

         text_css.split(" ").forEach(function (item) {
            self.renderer2.addClass(componentRef.location.nativeElement, item);
         });
         self.renderer2.addClass(componentRef.location.nativeElement, 'eh-graph-categorical');
         self.renderer2.addClass(componentRef.location.nativeElement, 'eh-'+dim);
         // this.renderer2.setAttribute(componentRef.location.nativeElement, 'dimension',dim);

         if (this.dataset.aliases[dim + "_label"] != undefined) {
            componentInstance.setXLabel(this.dataset.aliases[dim + "_label"]);
         }
         else {
            componentInstance.setXLabel(dim);
         }
         componentInstance.register(dim, this.setBarCategoricalData);
         componentInstance.registerCount(dim, this.setCountBarCategoricalData);
         componentInstance.registerMaxCount(dim, this.setMaxCountBarCategoricalData);
         if (typeof this.dataset.horizontalBarDimension[dim] !== 'undefined' && this.dataset.horizontalBarDimension[dim] === true) {
            componentInstance.setHorizontal(true);
         }

         this.bar_categorical_restrictions[this.dataset.datasetName].forEach((entry) => {
            if (entry.dimName == dim) {
               componentInstance.setHaveMinSlider(true);
               if (entry.minValue === 0) {
                  componentInstance.setMinValue(entry.minValue);
               }
               else {
                  componentInstance.setMinValue(Math.pow(10, entry.minValue));
               }
               if (entry.maxValue === 0) {
                  componentInstance.setMaxValue(entry.maxValue);
               }
               else {
                  componentInstance.setMaxValue(Math.pow(10, entry.maxValue));
               }
            }
         });

         this.widgets.push({ key: dim, type: 'bar_categorical', widget: componentInstance });
      }

      for (const dim of this.dataset.treemapCategoricalDimension) {
         const component = this.componentFactory.resolveComponentFactory(TreemapChartComponent);

         let text_css = this.getComponentSize(dim);
         const componentRef = viewContainerRef.createComponent(component);
         const componentInstance = <TreemapChartComponent>componentRef.instance;

         text_css.split(" ").forEach(function (item) {
            self.renderer2.addClass(componentRef.location.nativeElement, item);
         });
         self.renderer2.addClass(componentRef.location.nativeElement, 'eh-graph-treemap');
         // this.renderer2.setAttribute(componentRef.location.nativeElement, 'dimension',dim);

         componentInstance.setXLabel(dim);
         componentInstance.register(dim, this.setTreemapCategoricalData);

         this.widgets.push({ key: dim, type: 'treemap_categorical', widget: componentInstance });
      }
      for (const dim of Object.keys(this.dataset.temporalDimension)) {
         const component = this.componentFactory.resolveComponentFactory(LineChartComponent);

         let text_css = this.getComponentSize(dim);
         const componentRef = viewContainerRef.createComponent(component);
         const componentInstance = <LineChartComponent>componentRef.instance;

         text_css.split(" ").forEach(function (item) {
            self.renderer2.addClass(componentRef.location.nativeElement, item);
         });
         // this.renderer2.setAttribute(componentRef.location.nativeElement, 'dimension',dim);
         self.renderer2.addClass(componentRef.location.nativeElement, 'eh-graph-temporal');

         const lower = this.dataset.temporalDimension[dim].lower;
         const upper = this.dataset.temporalDimension[dim].upper;
         this.temporal[dim] = '/const=' + dim + '.interval.(' + lower + ':' + upper + ')';

         if (this.dataset.aliases[dim + "_label"] != undefined) {
            componentInstance.setXLabel(this.dataset.aliases[dim + "_label"]);
         }
         else {
            componentInstance.setXLabel(dim);
         }
         componentInstance.setLowerUpper(lower, upper);
         componentInstance.register(dim, this.setTemporalData);
         this.widgets.push({ key: dim, type: 'temporal', widget: componentInstance });
      }

      // load map
      this.loadWorldLayer();
      this.loadLayer();
      this.loadMapCard();

      // refresh input data
      this.loadWidgetsData();

      this.clearConstrains();

      // this.createCalendarWidget();
   }

   // isDataAvailable:boolean = false;


   setMapData() {
      let promises = this.getMapPromises();

      Promise.all(promises).then(() => {
         let prev_data = this.geo.json.get(this.getPrevRegion());
         let curr_data = this.geo.json.get(this.getCurrRegion());

         this.BottomRegionLayer.clearLayers();
         this.BottomRegionLayer.addData(prev_data);

         this.TopRegionLayer.clearLayers();
         this.TopRegionLayer.addData(curr_data);

         this.BottomPopRegionLayer.clearLayers();
         this.BottomPopRegionLayer.addData(prev_data);

         this.TopPopRegionLayer.clearLayers();
         this.TopPopRegionLayer.addData(curr_data);

         this.BottomDenRegionLayer.clearLayers();
         this.BottomDenRegionLayer.addData(prev_data);

         this.TopDenRegionLayer.clearLayers();
         this.TopDenRegionLayer.addData(curr_data);

         this.BottomCatRegionLayer.clearLayers()
         this.BottomCatRegionLayer.addData(prev_data)

         this.TopCatRegionLayer.clearLayers()
         this.TopCatRegionLayer.addData(curr_data)

         this.loadLegend(this.getCurrRegion());
         this.loadPopLegend(this.getCurrRegion());
         this.loadDenLegend(this.getCurrRegion());
         this.loadCatLegend(this.getCurrRegion())
      });
   }

   getAggr() {
      return this.aggr;
   }


   updateInfoName() {
      let feature = this.getCurrentFeature();
      if (feature) {
         this.info_name = this.region_name(feature);
      }
      else {
         this.info_name = this.schemaService.getGlobal()['worldLabel'];
      }
   }

   updateInfoData() {
      let query = '/query/dataset=' + this.dataset.datasetName + '/aggr=count' +
         this.getBarCategoricalConst() +
         this.getTreemapCategoricalConst() +
         this.getTemporalConst() +
         this.getRegionConst(this.getCurrentFeature());

      // let query = updateQueryData();
      this.dataService.query(query).subscribe(data => {
         this.info_events[0] = data[0];
         if (this.getCurrentFeature()) {
            let r_code = String(this.region_code(this.getCurrentFeature()));
            let value_region = this.geo.json_value.get(this.getCurrRegion()).get(r_code.toUpperCase());
            if (value_region == undefined) {
               this.info_events[0] = 0;
            }
         }
         this.info_pop[0] = this.getCountPop(this.getCurrentFeature());
         this.info_den[0] = (this.info_events[0] / this.info_pop[0]) * 1000000;
      });

      query = '/query/dataset=' + this.dataset.datasetName + '/aggr=count' +
         this.getRegionConst();

      this.dataService.query(query).subscribe(data => {
         this.info_events[1] = data[0];
         this.info_pop[1] = this.getCountPop();
         this.info_den[1] = (this.info_events[1] / this.info_pop[1]) * 1000000;
      });

      if (this.getCurrentFeature()) {
         let r_code = String(this.region_code(this.getCurrentFeature()));
         let value_region_cat = this.geo.json_value_cat.get(this.getCurrRegion()).get(r_code.toUpperCase())

         if (value_region_cat == undefined) {
            this.info_cat = ["", 0.0, 0.0, 0.0]
         }
         else {
            this.info_cat[0] = this.dataset.aliases[this.dataset['dominance_dim_map'] + "_desc"][value_region_cat[4]]
            this.info_cat[1] = value_region_cat[1]
            this.info_cat[2] = value_region_cat[3]
            this.info_cat[3] = (value_region_cat[1] / value_region_cat[3]) * 100
         }
      }

   }

   updateInfo() {
      this.updateInfoName();
      this.updateInfoData();
   }


   getCurrRegion() {
      return this.schemaService.getGlobal()["regionCategoricalDimension"][this.currRegion];
   }

   loadWorldLayer() {
      let self = this;

      let layerOnMouseOver = (feature, el, dim) => {
         if (self.geo.json_curr.get(self.getCurrRegion()) !== undefined) {
            self.geo.json_curr.set(self.getCurrRegion(), undefined);
            self.updateInfo();
         }
      };

      let getLayer = (dim) => {
         return L.geoJSON(this.geo.json.get(dim), {
            style: function (feature) {
               return { fillColor: 'black', color: 'black', weight: 0.0, opacity: 0.0, fillOpacity: 0.0 };
            },
            onEachFeature: (feature, layer) => {
               layer.on({
                  mouseover: (el) => layerOnMouseOver(feature, el, dim)
               });
            }
         });
      };

      if (this.MiddleRegionLayer) this.mapService.map.removeLayer(this.MiddleRegionLayer);
      this.MiddleRegionLayer = getLayer(this.schemaService.getGlobal()['worldRegion']);
   }


   loadPopLegend(dim) {
      const svg = d3.select('#svg-color-pop-quant');
      svg.selectAll('*').remove();

      if (!this.population.visible || this.geo.json_min_max_pop.get(dim)[0] == Number.MAX_SAFE_INTEGER)
         return;

      svg.append('g')
         .attr('class', 'legendPopQuant')
         .attr('transform', 'translate(0, 0)');

      let scaleColor = this.color_map["normal_pop"](dim);

      const colorLegend = legendColor()
         .ascending(true)
         .labelFormat(this.getFormatter())
         .scale(scaleColor);

      svg.select('.legendPopQuant')
         .call(colorLegend);
   }

   loadDenLegend(dim) {
      const svg = d3.select('#svg-color-den-quant');
      svg.selectAll('*').remove();

      if (!this.density.visible || this.geo.json_min_max_den.get(dim)[0] == Number.MAX_SAFE_INTEGER)
         return;

      svg.append('g')
         .attr('class', 'legendDenQuant')
         .attr('transform', 'translate(0, 0)');

      let scaleColor = this.color_map["normal_den"](dim);

      const colorLegend = legendColor()
         .ascending(true)
         .labelFormat(this.getFormatter())
         .scale(scaleColor);

      svg.select('.legendDenQuant')
         .call(colorLegend);
   }

   loadCatLegend(dim) {
      const svg = d3.select('#svg-color-cat-quant');
      svg.selectAll('*').remove();

      if (!this.categorical.visible)
         return;

      svg.append('g')
         .attr('class', 'legendCatQuant')
         .attr('transform', 'translate(0, 0)');

      let scaleColor = this.color_map["normal_cat"];

      const colorLegend = legendColor()
         .ascending(true)
         .labelFormat(this.getFormatter())
         .scale(scaleColor);

      svg.select('.legendCatQuant')
         .call(colorLegend);
   }

   onRegionAdd() {
      this.health.visible = true;
      this.loadLegend(this.getCurrRegion());
   }

   onRegionRemove() {
      this.health.visible = false;
      this.loadLegend(this.getCurrRegion());
   }

   onRegionPopAdd() {
      this.population.visible = true;
      this.loadPopLegend(this.getCurrRegion());
   }

   onRegionPopRemove() {
      this.population.visible = false;
      this.loadPopLegend(this.getCurrRegion());
   }

   onRegionDenAdd() {
      this.density.visible = true;
      this.loadDenLegend(this.getCurrRegion());
   }

   onRegionDenRemove() {
      this.density.visible = false;
      this.loadDenLegend(this.getCurrRegion());
   }

   onRegionCatAdd() {
      this.categorical.visible = true
      this.loadCatLegend(this.getCurrRegion())
   }

   onRegionCatRemove() {
      this.categorical.visible = false
      this.loadCatLegend(this.getCurrRegion())
   }

   onMapMoveStart() {
      this.ableToGetData = false;
   }

   onMapMoveEnd() {
      this.ableToGetData = true;
   }

   onMapZoomEnd() {
      this.currentZoom = Math.round(this.mapService.map.getZoom());
   }
   getPrevRegion() {
      if (this.currRegion == 0) {
         return this.schemaService.getGlobal()["regionCategoricalDimension"][0];
      }
      else {
         return this.schemaService.getGlobal()["regionCategoricalDimension"][this.currRegion - 1];
      }
   }
   getFormatter() {
      return this.aggr_map[this.options.get('aggr').value].formatter;
   }
   loadLegend(dim) {
      const svg = d3.select('#svg-color-quant');
      svg.selectAll('*').remove();

      if (!this.health.visible || this.geo.json_min_max.get(dim)[0] == Number.MAX_SAFE_INTEGER)
         return;

      svg.append('g')
         .attr('class', 'legendQuant')
         .attr('transform', 'translate(0, 0)');

      let scaleColor = this.color(dim);

      const colorLegend = legendColor()
         .ascending(true)
         .labelFormat(this.getFormatter())
         .scale(scaleColor);

      svg.select('.legendQuant')
         .call(colorLegend);
   }

   median(values) {
      if (values.length === 0) return undefined;
      var half = Math.floor(values.length / 2);

      if (values.length % 2)
         return values[half];

      return (values[half - 1] + values[half]) / 2.0;
   }

   formatThousandsSeperator(n) {
      return d3.format(",")(n);
   }

   formatDecimal(n) {
      return d3.format("0.2f")(n);
   }

   formatThousandsSeperatorDecimal(n) {
      return d3.format(",.2f")(n);
   }


   openWindow(contentTemplate) {
      if(this.current_modal!=null) this.current_modal.close();
      this.current_modal = this.windowService.open(
         contentTemplate,
         {
            title: 'Configuração',
            context: {
               text: this.project_hash_value,
            },
         },
      );
   }

   categoricalConst2Array(categoricalConst) {
      let numbersStr = categoricalConst.substring(categoricalConst.lastIndexOf("(") + 1,
         categoricalConst.lastIndexOf(")"));
      let numbers = numbersStr.split(":").map(Number);
      return numbers;
   }

   copyToClipboard(inputElement) {
      inputElement.select();
      document.execCommand('copy');
      inputElement.setSelectionRange(0, 0);
      this.current_modal.close();
      this.toastrComponent.makeToast('success', 'Copiado', 'O conteúdo foi copiado com sucesso.');
   }

   loadProjectHashValue(inputElement) {
      this.project_hash_value = inputElement.value;
      let data = undefined;
      try {
         data = JSON.parse(this.encrDecrService.get(this.key_encr, this.project_hash_value));
      }
      catch (error) {
         console.log(error);
         this.current_modal.close();
         this.toastrComponent.makeToast('danger', 'Erro', 'Erro ao abrir.');
         this.project_hash_value = "";
         return;
      }

      this.temporal = {};
      this.bar_categorical = {};
      this.treemap_categorical = {};
      for (const dim of this.schemaService.getGlobal()["regionCategoricalDimension"]) {
         this.geo.json_selected.set(dim, new Map());
      }
      this.bar_categorical_restrictions[this.dataset.datasetName].forEach((entry) => {
         entry.filter = '-';
      });

      for (const dim of this.dataset.barCategoricalDimension) {
         if (data[dim]) {
            this.bar_categorical[dim] = data[dim];
         }
      }

      for (const dim of this.dataset.treemapCategoricalDimension) {
         if (data[dim]) {
            this.treemap_categorical[dim] = data[dim];
         }
      }

      for (const dim of Object.keys(this.dataset.temporalDimension)) {
         if (data[dim]) {
            this.temporal[dim] = data[dim];
         }
      }

      for (const ref of this.widgets) {
         if (ref.type === 'bar_categorical') {
            if (this.bar_categorical[ref.key]) {
               const catArray = this.categoricalConst2Array(this.bar_categorical[ref.key]);
               (<BarChartComponent>ref.widget).setSelectedElts(catArray);
               this.bar_categorical_restrictions[this.dataset.datasetName].forEach((entry) => {
                  if (entry.dimName == ref.key) {
                     let valuesFilter = '';
                     for (const elt of catArray) {
                        valuesFilter += this.dataset.aliases[ref.key][elt] + ','
                     }
                     valuesFilter = valuesFilter.substr(0, valuesFilter.length - 1);
                     entry.filter = valuesFilter;
                  }
               });

            }
         }
         else if (ref.type === 'treemap_categorical') {
            if (this.treemap_categorical[ref.key]) {
               (<TreemapChartComponent>ref.widget).setSelectedElts(this.categoricalConst2Array(this.treemap_categorical[ref.key]));
            }
         }
      }

      this.setAggr();
      this.current_modal.close();
   }

   getRegionConstWDim(dim, idx) {
      let self = this;
      let output = "";

      if (self.geo.json_value.get(dim) == undefined) {
         return output;
      }

      if (self.geo.json_value.get(dim).size == 0) {
         return output;
      }

      let selected = this.geo.json_selected.get(dim);

      if (!selected || selected.size === 0) {
         return output;
      }

      let valid = false;
      let values = '/const=' + dim + '.values.(';

      selected.forEach((value, key, map) => {
         if (value) {
            let r_code_2 = String(this.region_code(key, idx));
            let value_one_selected = self.geo.json_value.get(dim).get(r_code_2.toUpperCase());
            if (value_one_selected != undefined) {
               valid = true;
               values += + value_one_selected[0] + ':';
            }
         }
      });

      values = values.substr(0, values.length - 1);
      values += ')';
      output += valid ? values : '';

      return output;
   }

   csvToMap(csvString, keyName, secondKeyName) {
      let lines = csvString.split('\n');
      let headerValues = lines[0].split(';');
      let dataValues = lines.splice(1).map(function (dataLine) { return dataLine.split(';'); });
      let mapResult = new Map();
      dataValues.map(function (rowValues) {
         let row = {};
         let key = "";
         let key2 = "";
         headerValues.forEach(function (headerValue, index) {
            if (headerValue == keyName) {
               key = (index < rowValues.length) ? rowValues[index] : null;
            }
            else if (headerValue == secondKeyName) {
               key2 = (index < rowValues.length) ? rowValues[index] : null;
            }
            else {
               row[headerValue] = (index < rowValues.length) ? rowValues[index] : null;
            }
         });
         if (!mapResult.has(key)) {
            mapResult.set(key, new Map());
         }
         mapResult.get(key).set(key2, row);
      });
      return mapResult;
   }

   preInitialize() {
      this.project_hash_value = "";
      this.temporal = {};
      this.bar_categorical = {};
      this.treemap_categorical = {};
      for (const dim of this.schemaService.getGlobal()["regionCategoricalDimension"]) {
         this.geo.json_selected.set(dim, new Map());
      }
      for (const ref of this.widgets) {
         if (ref.type === 'bar_categorical') {
            (<BarChartComponent>ref.widget).clearSelectedElts();
         }
         else if (ref.type === 'treemap_categorical') {
            (<TreemapChartComponent>ref.widget).clearSelectedElts();
         }
      }
      this.bar_categorical_restrictions[this.dataset.datasetName].forEach((entry) => {
         entry.filter = '-';
      });
      this.geo.json_curr = new Map();
      this.geo.json_value = new Map();
   }

   ngOnInit(): void {
      d3.formatDefaultLocale({
         "decimal": ",",
         "thousands": ".",
         "grouping": [3],
         "currency": ["R$", ""]
      });
      this.mapService.load_CRSEPSG3857();

      L.control.zoom({
         position:'bottomright'
      }).addTo(this.mapService.map);

      this.activatedRoute.params.subscribe(params => {
         const param = params['dataset'];
         if (param !== undefined) {
            if (this.dataset) {
               this.preInitialize();
            }
            this.dataset = this.schemaService.get(param);
            this.registersLabel = this.dataset.registersLabel
            this.dominance_dim_label = this.dataset.dominance_dim_label
            this.have_categorical_dominance_map = this.dataset.have_categorical_dominance_map
            this.initialize();
         }
         else {
            const link = ['/demo3', this.configService.defaultDataset];
            this.router.navigate(link);
         }
      });
   }

   ngAfterViewInit() {
      this.marker = new Marker(this.mapService);
      this.marker.register(this.setRegionData);

      this.mapService.disableEvent(this.mapwidgets);

      this.loadWidgetsData();
   }

}
