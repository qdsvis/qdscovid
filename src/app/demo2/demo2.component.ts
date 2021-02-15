import {
   Component,
   ViewChild,
   OnInit,
   ElementRef,
   AfterViewInit,
   ComponentFactoryResolver,
   ViewContainerRef,
   Renderer2,
   NgModule
} from '@angular/core';

import { ThemeModule } from '../@theme/theme.module';
import { FormBuilder, FormGroup, FormControl, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { GeocodingService } from '../services/geocoding.service';
import { DataService } from '../services/data.service';
import { MapService } from '../services/map.service';

import * as d3 from 'd3';
import * as L from 'leaflet';
import * as moment from 'moment';
import { legendColor } from 'd3-svg-legend';

import { Marker } from '../marker';
import { Mercator } from '../mercator';
import { Location } from '../location';

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { SchemaService } from '../services/schema.service';

import { Options } from 'ng5-slider';

// widgets
import { Widget } from '../widget';
import { BarChartComponent } from '../pages/graphics/bar-chart/bar-chart.component';
import { LineChartComponent } from '../pages/graphics/line-chart/line-chart.component';
import { WidgetHostDirective } from '../widget-host.directive';
import { CalendarComponent } from '../calendar/calendar.component';
import { ConfigurationService } from '../services/configuration.service';
import {
   MatSidenav,
   MatRadioChange,
   MatSnackBar,
   MatSnackBarConfig
} from '@angular/material';
import { HttpErrorResponse } from '@angular/common/http';
import { GeoDataService } from '../services/geo-data.service';
import { TreemapChartComponent } from '../pages/graphics/treemap-chart/treemap-chart.component';

import { EncrDecrService } from '../services/encr-decr.service';

import { NgxSpinnerService } from 'ngx-spinner';

interface WidgetType {
   key: string;
   type: string;
   widget: Widget;
}

interface DimConstraints {
   [key: string]: string;
}

@NgModule({
   imports: [
      ThemeModule,
   ],
})

@Component({
   selector: 'app-demo2',
   templateUrl: './demo2.component.html',
   styleUrls: ['./demo2.component.scss']
})
export class Demo2Component implements OnInit, AfterViewInit {
   @ViewChild('sidenav', {static: true}) sidenav: MatSidenav;
   @ViewChild('mapwidgets', {static: true}) mapwidgets: ElementRef;

   private title = 'app';
   private marker: Marker;

   private MiddleRegionLayer: L.GridLayer;

   private BottomRegionLayer: L.GridLayer;
   private TopRegionLayer: L.GridLayer;

   private BottomPopRegionLayer: L.GridLayer;
   private TopPopRegionLayer: L.GridLayer;

   private BottomDenRegionLayer: L.GridLayer;
   private TopDenRegionLayer: L.GridLayer;

   private layersControl;

   // schema
   ///////////////////////////////////
   private aggr: string;
   dataset: any;

   // map card
   ///////////////////////////////////
   currentZoom = 0;
   maximumZoom = 0;
   maximumPop = 0;

   //
   ///////////////////////////////////
   notRefreshTreemapGraphs = [];

   // queries
   ///////////////////////////////////
   private temporal: DimConstraints = {};
   private bar_categorical: DimConstraints = {};
   private treemap_categorical: DimConstraints = {};

   slideSort = false;

   // widgets
   //////////////////////////////////
   @ViewChild('container', { read: ViewContainerRef, static:true }) container: ViewContainerRef;
   @ViewChild('map', { read: ViewContainerRef, static:true}) footerCtnRef: ViewContainerRef;

   private widgets: Array<WidgetType> = [];

   mode = new FormControl('over');
   options: FormGroup;

   currRegion = 0;
   region_name(feature) {
      switch (this.currRegion) {
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
   population_code(feature) {
      switch (this.currRegion) {
         case 0:
            return feature.properties.population;
         case 1:
            return feature.properties.population;
         default:
            return feature.properties.population;
      }
   }

   health = {
      visible: true
   }

   population = {
      visible: true
   }

   density = {
      visible: true
   }

   optionsRegions = [{value: 0, label: "Estados"}, {value:1, label: "Municípios"}];

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
   }

   bar_categorical_restrictions = {
      sus_cont_ciap: [
         {minValue: 3, maxValue: 5, count: 0, maxCount: 0, filter: '-', viewValue: ' de semanas de gestação', dimName: 'semanas_gestacional'},
         {minValue: 1, maxValue: 5, count: 0, maxCount: 0, filter: '-', viewValue: ' de qtd. de CIAPs', dimName: 'qtd_ciaps'},
      ],
      sus_ciap: [
         //{minValue: 6, maxValue: 7, count: 0, maxCount: 0, filter: '-', viewValue: ' de CIAP', dimName: 'ciap'},
      ]
   };

   aggr_values = [
      { value: 'count', viewValue: 'Contagem' } /*,
      { value: 'mean', viewValue: 'Média' },
      { value: 'variance', viewValue: 'Variância' },
      { value: 'quantile', viewValue: 'Quantil' },
      { value: 'cdf', viewValue: 'Quantil inverso' }*/
   ];

   aggr_map = {
      'count': {
         key: 'count',
         sufix: undefined,
         label: 'Contagem',
         formatter: d3.format('.2s')
      }/*,
      'mean': {
         key: 'average',
         sufix: '_g',
         label: 'mean',
         formatter: d3.format('.2s')
      },
      'variance': {
         key: 'variance',
         sufix: '_g',
         label: 'variance',
         formatter: d3.format('.2s')
      },
      'quantile': {
         key: 'quantile',
         sufix: '_t',
         label: 'quantile',
         formatter: d3.format('.2s')
      },
      'cdf': {
         key: 'inverse',
         sufix: '_t',
         label: 'cdf',
         formatter: d3.format('.2f')
      },*/
   };

   color: any;

   range_map = {
      'normal': ['#ffffd9','#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#253494','#081d58'],
      'normal_2': ['#ffffd9','#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#253494','#081d58', '#cb181d', '#67000d']
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

      'ryw': (count) => {
         const lc = Math.log(count) / Math.log(100);

         const r = Math.floor(256 * Math.min(1, lc));
         const g = Math.floor(256 * Math.min(1, Math.max(0, lc - 1)));
         const b = Math.floor(256 * Math.min(1, Math.max(0, lc - 2)));

         return 'rgba(' + r + ',' + g + ',' + b + ',' + 0.75 + ')';
      }
   };

   info_name = '';
   info_events = [0, 0];
   info_pop = [0, 0];
   info_den = [0, 0];

   ableToGetData = true;

   project_hash_value = "";

	key_encr = "combaftp";

   constructor(
      private geo: GeoDataService,

      private configService: ConfigurationService,
      private schemaService: SchemaService,

      private mapService: MapService,
      private dataService: DataService,
      private geocodingService: GeocodingService,

		private encrDecrService: EncrDecrService,

      private router: Router,
      private activatedRoute: ActivatedRoute,

      private renderer2: Renderer2,
      private componentFactory: ComponentFactoryResolver,

      private formBuilder: FormBuilder,

      public snackBar: MatSnackBar,

		private spinner: NgxSpinnerService
   ) { }

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
			newRange = newRange.concat(['#cb181d', '#67000d'])
		}
		else if (max > q3 + 1.5 * iqr) {
			newRange = newRange.concat(['#cb181d'])
		}
		return newRange;
	}

   getFormatter() {
      return this.aggr_map[this.options.get('aggr').value].formatter;
   }

   formatThousandsSeperator(n) {
      return d3.format(",")(n);
   }

	formatDecimal(n) {
      return d3.format("0.3f")(n);
   }

   updateInfo() {
      this.updateInfoName();
      this.updateInfoData();
   }

   getCurrentFeature() {
      return this.geo.json_curr.get(this.getCurrRegion());
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
         this.info_den[0] = this.info_events[0] / this.info_pop[0];
      });

      query = '/query/dataset=' + this.dataset.datasetName + '/aggr=count' +
         this.getRegionConst();

      this.dataService.query(query).subscribe(data => {
         this.info_events[1] = data[0];
         this.info_pop[1] = this.getCountPop();
         this.info_den[1] = this.info_events[1] / this.info_pop[1];
      });
   }

   loadMapCard() {
      this.currentZoom = this.mapService.map.getZoom();
      this.maximumZoom = this.mapService.map.getMaxZoom();
      this.maximumPop = this.getCountMaxPop();
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
         .labelFormat(d3.format("0.3f"))
         .scale(scaleColor);

      svg.select('.legendDenQuant')
         .call(colorLegend);
   }

   getPrevRegion() {
      if (this.currRegion == 0) {
         return this.schemaService.getGlobal()["regionCategoricalDimension"][0];
      }
      else {
         return this.schemaService.getGlobal()["regionCategoricalDimension"][this.currRegion - 1];
      }
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
      }

      if (this.MiddleRegionLayer) this.mapService.map.removeLayer(this.MiddleRegionLayer);
      this.MiddleRegionLayer = getLayer(this.schemaService.getGlobal()['worldRegion']);
   }

	median(values) {
		if (values.length === 0) return undefined;
		var half = Math.floor(values.length / 2);

		if (values.length % 2)
			return values[half];

		return (values[half - 1] + values[half]) / 2.0;
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

                  value.map((el) => {
                     if (!isNaN(el[1])) {
                        curr_minmax[0] = Math.min(curr_minmax[0], el[1]);
                        curr_minmax[1] = Math.max(curr_minmax[1], el[1]);
								self.geo.json_value.get(dim).set(this.dataset.aliases[dim][el[0]].toUpperCase(), [el[0], el[1]]);
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
								densities.push(nume[1] / deno);

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

					resolve(true);
				});
			});
		};

		// wait for all promises fineshes and then ...
		promises.push(getPromise(self.getCurrRegion()));

		return promises;
	}

	loadLayer() {
		let self = this;

		let promises = self.getMapPromises();

		Promise.all(promises).then(() => {
			let getLayerColor = (feature, dim, key) => {
				let r_code = String(this.region_code(feature));
				let value = undefined;
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
					value = (nume == undefined) ? undefined : (nume[1] / deno);
				}
				let style = <any>{};
				if (value != undefined) {
					if (key == "curr")
						style.fillColor = self.color(dim)(value[1]);
					else if (key == "curr_pop")
						style.fillColor = self.color_map["normal_pop"](dim)(value);
					else if (key == "curr_den")
						style.fillColor = self.color_map["normal_den"](dim)(value);
					else
						style.fillColor = 'rgba(0,0,0,0)';
					style.color = 'black';
					style.weight = 0.2;
					style.opacity = 0.70;
					style.fillOpacity = 0.70;
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
				}
				else {
					self.geo.json_selected.get(dim).set(feature, true);
				}

				let style = getLayerColor(feature, dim, key);
				style.weight = 4.0;

				el.target.setStyle(style);
				self.loadWidgetsData();

				return style;
			}

			self.updateAggr();

			self.health.visible = true;
			self.population.visible = false;
			self.density.visible = false;
			self.loadLegend(self.getCurrRegion());

			let getLayerByKey = (key) => {
				if (key == 'curr' || key == 'curr_pop' || key == "curr_den") {
					return self.getCurrRegion();
				}
				else {
					return self.getPrevRegion();
				}
			}

			let getLayer = (key) => {
				return L.geoJSON(this.geo.json.get(getLayerByKey(key)), {
					keepBuffer: 2,
					updateInterval: 40,
					updateWhenIdle: true,
					updateWhenZooming: false,

					style: (feature) => {
						if (key == 'prev' || key == "prev_pop" || key == "prev_den") {
							return { fillColor: 'rgba(0,0,0,0)', color: 'black', weight: 2.0, opacity: 1.0, fillOpacity: 0.0 };
						}
						else {
							return getLayerColor(feature, self.getCurrRegion(), key);
						}
					},
					onEachFeature: (feature, layer) => {
						if (key == 'curr' || key == 'curr_pop' || key == "curr_den") {
							layer.on({
								mouseover: (el) => layerOnMouseOver(feature, el, self.getCurrRegion(), key),
								mouseout: (el) => layerOnMouseOut(feature, el, self.getCurrRegion(), key),
								click: (el) => layerOnMouseClick(feature, el, self.getCurrRegion(), key)
							});
						}
					}/*,
					filter: function (feature, layer) {
						if (key == 'prev') {
							return true;
						}
						else {
							let r_code = String(this.region_code(feature));
							let isValid = self.geo.json_value.get(self.getCurrRegion()).find((el) => self.dataset.aliases[self.getCurrRegion()][el[0]].toUpperCase() === r_code.toUpperCase());

							if (isValid != undefined) {
								if (isValid && isValid[1] >= self.options.get('display_threshold').value) {
									return true;
								}
								else {
									return false;
								}
							}
							else {
								return false;
							}
						}
					}*/
				});
			}

			if (this.BottomRegionLayer) this.mapService.map.removeLayer(this.BottomRegionLayer);
			if (this.TopRegionLayer) this.mapService.map.removeLayer(this.TopRegionLayer);
			if (this.BottomPopRegionLayer) this.mapService.map.removeLayer(this.BottomPopRegionLayer);
			if (this.TopPopRegionLayer) this.mapService.map.removeLayer(this.TopPopRegionLayer);
			if (this.BottomDenRegionLayer) this.mapService.map.removeLayer(this.BottomDenRegionLayer);
			if (this.TopDenRegionLayer) this.mapService.map.removeLayer(this.TopDenRegionLayer);

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

			let overlay_maps = {
				"Atendimentos": agiradom,
				"População": map_population,
				"Densidade": map_density
			};

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

	onMapMoveStart() {
		this.ableToGetData = false;
	}

	onMapMoveEnd() {
		this.ableToGetData = true;
	}

	onMapZoomEnd() {
		this.currentZoom = Math.round(this.mapService.map.getZoom());
	}

	loadWidgetsData() {
		this.updateInfo();
		this.updateProjectHashValue();

		let color = 'normal';

		for (const ref of this.widgets) {
			if (ref.type === 'bar_categorical') {
				ref.widget.setFormatter(this.getFormatter());

				this.bar_categorical_restrictions[this.dataset.datasetName].forEach((entry) => {
					if (entry.dimName == (<BarChartComponent>ref.widget).getDim()) {
						(<BarChartComponent>ref.widget).setHaveMinSlider(true);
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

	setMapData() {
		this.spinner.show();
		let promises = this.getMapPromises();

		Promise.all(promises).then(() => {
			this.loadLegend(this.getCurrRegion());
			this.loadPopLegend(this.getCurrRegion());
			this.loadDenLegend(this.getCurrRegion());

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
			
			this.spinner.hide();
		});
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

	setMapRegion(event: MatRadioChange) {
		this.currRegion = event.value;
		this.setMapData();
	}

	setAggr() {
		this.updateAggr();
		this.loadWidgetsData();
		this.setMapData();
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
	}

	setCountBarCategoricalData = (dim: string, count: any) => {
		this.bar_categorical_restrictions[this.dataset.datasetName].forEach((entry) => {
			if (entry.dimName == dim) {
				entry.count = count;
			}
		});
	}

	setMaxCountBarCategoricalData = (dim: string, maxCount: any) => {
		this.bar_categorical_restrictions[this.dataset.datasetName].forEach((entry) => {
			if (entry.dimName == dim) {
				entry.maxCount = maxCount;
			}
		});
	}

	setTreemapCategoricalData = (dim: string, selected: Array<string>) => {
		this.notRefreshTreemapGraphs = [];
		let temp = this.notRefreshTreemapGraphs.find(function(element){ return element==dim;});
		if(typeof temp === 'undefined') this.notRefreshTreemapGraphs.push(dim);
		if (selected.length === 0) {
			this.treemap_categorical[dim] = '';
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

			this.treemap_categorical[dim] = values;
		}

		this.loadWidgetsData();
		this.setMapData();
	}

	setTemporalData = (dim: string, interval: Array<string>) => {

		const values = '/const=' + dim + '.interval.(' + interval[0] + ':' + interval[1] + ')';
		this.temporal[dim] = values;

		this.loadWidgetsData();
		this.setMapData();
	}

	setRegionData = (latlng: any, zoom: number): void => {
	}

	getAggr() {
		return this.aggr;
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

	setCategoricalRestrictions(event, entry) {
		this.loadWidgetsData();
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
		this.sidenav.toggle();
		this.snackBar.open('Copiado', 'Fechar', {
			duration: 2000,
			viewContainerRef: this.footerCtnRef
		});
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

	loadProjectHashValue(inputElement) {
		this.project_hash_value = inputElement.value;
		let data = undefined;
		try {
			data = JSON.parse(this.encrDecrService.get(this.key_encr, this.project_hash_value));
		}
		catch (error) {
			console.log(error);
			this.sidenav.toggle();
			this.snackBar.open('Erro ao abrir', 'Fechar', {
				duration: 2000,
				viewContainerRef: this.footerCtnRef
			});
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
		this.sidenav.toggle();
	}

	clearConstrains() {
		this.project_hash_value = "";
		this.temporal = {};
		this.bar_categorical = {};
		this.treemap_categorical = {};
		this.notRefreshTreemapGraphs = [];
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
		this.slideSort = false;
		this.sortGraphs(null);
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

	ngOnInit() {
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
				this.initialize();
			}
			else {
				const link = ['/demo2', this.configService.defaultDataset];
				this.router.navigate(link);
			}
		});
	}

	ngAfterViewInit() {
		this.marker = new Marker(this.mapService);
		this.marker.register(this.setRegionData);

		this.mapService.disableEvent(this.mapwidgets);

		this.loadWidgetsData();
		// @ts-ignore
		import('../../assets/scripts/general.js');
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

		for (const dim of this.dataset.barCategoricalDimension) {
			const component = this.componentFactory.resolveComponentFactory(BarChartComponent);

			const componentRef = viewContainerRef.createComponent(component);
			const componentInstance = <BarChartComponent>componentRef.instance;

			this.renderer2.addClass(componentRef.location.nativeElement, 'app-footer-item');

			if (this.dataset.aliases[dim + "_label"] != undefined) {
				componentInstance.setXLabel(this.dataset.aliases[dim + "_label"]);
			}
			else {
				componentInstance.setXLabel(dim);
			}
			componentInstance.register(dim, this.setBarCategoricalData);
			componentInstance.registerCount(dim, this.setCountBarCategoricalData);
			componentInstance.registerMaxCount(dim, this.setMaxCountBarCategoricalData);

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

			const componentRef = viewContainerRef.createComponent(component);
			const componentInstance = <TreemapChartComponent>componentRef.instance;

			this.renderer2.addClass(componentRef.location.nativeElement, 'app-footer-item');

			componentInstance.setXLabel(dim);
			componentInstance.register(dim, this.setTreemapCategoricalData);

			this.widgets.push({ key: dim, type: 'treemap_categorical', widget: componentInstance });
		}

		for (const dim of Object.keys(this.dataset.temporalDimension)) {
			const component = this.componentFactory.resolveComponentFactory(LineChartComponent);

			const componentRef = viewContainerRef.createComponent(component);
			const componentInstance = <LineChartComponent>componentRef.instance;

			this.renderer2.addClass(componentRef.location.nativeElement, 'app-footer-item');

			const lower = this.dataset.temporalDimension[dim].lower;
			const upper = this.dataset.temporalDimension[dim].upper;
			this.temporal[dim] = '/const=' + dim + '.interval.(' + lower + ':' + upper + ')';

			if (this.dataset.aliases[dim + "_label"] != undefined) {
				componentInstance.setXLabel(this.dataset.aliases[dim + "_label"]);
			}
			else {
				componentInstance.setXLabel(dim);
			}
			componentInstance.register(dim, this.setTemporalData);
			this.widgets.push({ key: dim, type: 'temporal', widget: componentInstance });
		}

		// load map
		this.loadWorldLayer();
		this.loadLayer();
		this.loadMapCard();

		// refresh input data
		this.loadWidgetsData();
	}

	getPayloadInfo(key: string) {
		return d3.format('.2f')(this.dataset.payloadValues[this.options.get('payload').value][this.options.get('aggr').value][key]);
	}

	setPayloadInfo(key: string, value: number) {
		this.dataset.payloadValues[this.options.get('payload').value][this.options.get('aggr').value][key] = value;

		this.setAggr();
	}

	sortGraphs(e) {
		if(e != null && e.source.checked == true){
			d3.select('#panel-right').attr('uk-sortable', '');
			this.slideSort= true;
		}
		else{
			d3.select('#panel-right').attr('uk-sortable', null);
			this.slideSort = false;
		}
	}
}
