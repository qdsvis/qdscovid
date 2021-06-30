import { Component, ViewChild, OnInit, ElementRef, AfterViewInit, Input, ViewEncapsulation, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';

import { Widget } from '../../../widget';

import * as d3 from 'd3';
import * as moment from 'moment';

import { Subject } from 'rxjs/Subject';
import { DataService } from '../../../services/data.service';
import { SchemaService } from '../../../services/schema.service';
import { ConfigurationService } from '../../../services/configuration.service';
import { ActivatedRoute } from '@angular/router';
import { TimezoneService } from '../../../services/timezone.service';
import {NbDateService} from "@nebular/theme";

@Component({
   selector: 'app-line-chart',
   encapsulation: ViewEncapsulation.None,
   templateUrl: './line-chart.component.html',
   styleUrls: ['./line-chart.component.css']
})
export class LineChartComponent implements Widget, OnInit, AfterViewInit, OnDestroy {
   uniqueId = 'id-' + Math.random().toString(36).substr(2, 16);

   dataset: any;
   data = [];
   dataWihtoutInterval = [];
   dim = '';
   subject = new Subject<any>();
   callbacks: any[] = [];

   reloadData = false;

   xLabel = '';
   yLabel = '';
   yFormat = d3.format('.2s');

   range = 'normal';

   dat_lower = 0;
   dat_upper = 0;
   brushedBegin: any;
   brushedEnd:  any;

   range_map = {
      'normal': ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837'].reverse(),

      'outlier': ['rgb(215,25,28)', 'rgb(253,174,97)', 'rgb(255,255,191)'].reverse()
   }

   options: FormGroup;
   // minDate = this.dateService.today();
   // maxDate = this.dateService.today();

   wihtoutIntervalInitialDate: Date;
   wihtoutIntervalFinalDate: Date;

   constructor(
      fb: FormBuilder,
      private timezoneService: TimezoneService,
      private dataService: DataService,
      private configService: ConfigurationService,
      private schemaService: SchemaService,
      private activatedRoute: ActivatedRoute,
      protected dateService: NbDateService<Date>) {
      this.activatedRoute.params.subscribe(params => {
            const param = params['dataset'];
            if (param !== undefined) {
               this.dataset = this.schemaService.get(param);
            } else {
               this.dataset = this.schemaService.get(this.configService.defaultDataset);
            }
         }
      );

      this.options = fb.group({
         fromDateTime: new FormControl(Date.now()),
         toDateTime: new FormControl(Date.now())
      });

      this.subject.subscribe(term => {
         let querySplit = term.split("const="+this.dim+".interval"), querySplit2 = [];
         if(querySplit.length>1){
            querySplit2 = querySplit[1].split('/');
            querySplit2[0] = 'const='+this.dim+'.interval.(' + String(this.dat_lower/1000) + ':' + String(this.dat_upper/1000) + ')';
         }
         let queryAll = querySplit[0]+querySplit2.join('/');
         this.dataService.query(queryAll).subscribe(data => {
            this.dataWihtoutInterval=data[0];
            if (data[0].length) {
               this.wihtoutIntervalInitialDate = this.timezoneService.getDateFromSeconds(data[0][0][0]);
               this.wihtoutIntervalFinalDate = this.timezoneService.getDateFromSeconds(data[0][data[0].length - 1][0]);

            } else {
               this.wihtoutIntervalInitialDate = new Date(this.dat_lower);
               this.wihtoutIntervalFinalDate = new Date(this.dat_upper);
            }

            if (data[0].length) {
               this.dataWihtoutInterval.forEach((d) => {
                  d[0] = this.timezoneService.getDateFromSeconds(d[0]);
               });
            }
         });
         this.dataService.query(term).subscribe(data => {
            this.data = data[0];

            if (data[0].length) {
               this.data.forEach((d) => {
                  d[0] = this.timezoneService.getDateFromSeconds(d[0]);
               });
            }

            this.loadWidget();
         });
      });
   }

   ngOnInit() { }

   setLowerUpper(lower: string, upper:string){
      this.dat_lower = parseInt(lower)*1000;
      this.dat_upper = parseInt(upper)*1000;
   }

   setColorRange(range) {
      this.range = range;
   }

   setXLabel(value: string) {
      this.xLabel = value;
   }

   setYLabel(value: string) {
      this.yLabel = value;
   }

   setFormatter(formatter: any) {
      this.yFormat = formatter;
   }

   completeCurve(curve, defaultMinTime, defaultMaxTime, step) {
      if (curve.length === 0) {
         const newCurve = [];
         for (let i = defaultMinTime; i <= defaultMaxTime; i += step) {
            newCurve.push([i, 0]);
         }
         return newCurve;
      } else if (curve.length === 1) {
         const newCurve = [];
         const onlyTime = curve[0][0];
         for (let t = defaultMinTime; t <= defaultMaxTime; t += step) {
            let value = 0;
            if (t === onlyTime) {
               value = curve[0][1];
            }

            newCurve.push([t, value]);
         }
         return newCurve;
      } else {
         const newCurve = [];
         let auxIndex = 0;
         for (let t = curve[0][0]; t <= curve[curve.length - 1][0]; t += step) {
            let value = 0;
            if (t === curve[auxIndex][0]) {
               value = curve[auxIndex][1];
               auxIndex += 1;
            }
            newCurve.push([t, value]);
         }
         return newCurve;
      }
   }

   setDataset(dataset: string) {
      this.dataset = this.schemaService.get(dataset);
   }

   setNextTerm(query: string) {
      this.subject.next(query);
   }

   register(dim: string, callback: any): void {
      this.dim = dim;
      this.callbacks.push({ dim, callback });
   }

   unregister(callback: any): void {
      this.callbacks = this.callbacks.filter(el => el.callback !== callback);
   }

   broadcast(date_ini = null, date_end = null): void {
      if(this.reloadData){
         const interval = [Number(String(this.timezoneService.getFormatedDate(date_ini)).split('.')[0]),
            Number(String(this.timezoneService.getFormatedDate(date_end)).split('.')[0])
         ];
         // console.log(interval);
         for (const pair of this.callbacks) {
            pair.callback(pair.dim, interval);
         }
      }
   }

   loadWidget = () => {
      const self = this;
      let container = (d3.select('#' + this.uniqueId).node() as any);

      if (container == (undefined || null) || container.parentNode == (undefined || null)) {
         return;
      }

      container = container.parentNode.getBoundingClientRect();

      var parseDate = d3.timeParse("%m/%d/%Y");

      // const margin = { top: 5, right: 5, bottom: 68, left: 55 };
      const margin = { top: 20, right: 5, bottom: 110, left: 35 };
      const margin2 = {top: 400, right: 5, bottom: 30, left: 35};
      const width = container.width - margin.left - margin.right;
      const height = container.height - margin.top - margin.bottom;
      const height2 = container.height - margin2.top - margin2.bottom;

      const x = d3.scaleTime<number, number>().range([0, width]);
      const x2 = d3.scaleTime<number, number>().range([0, width]);
      const y = d3.scaleLinear<number, number>().range([height, 0]);
      const y2 = d3.scaleLinear<number, number>().range([height2, 0]);

      const xAxis = d3.axisBottom(x);
      const xAxis2 = d3.axisBottom(x2);
      const yAxis = d3.axisLeft(y).tickFormat(self.yFormat).ticks(5);

      var brush = d3.brushX()
         .extent([[0, 0], [width, height2]])
         .on("brush end", brushed);
      var zoom = d3.zoom()
            .scaleExtent([1, Infinity])
            .translateExtent([[0, 0], [width, height]])
            .extent([[0, 0], [width, height]])
         // .on("zoom", zoomed)
      ;

      const line = d3.line()
         .x(function (d) { return x(d[0]); })
         .y(function (d) { return y(d[1]); });

      const line2 = d3.line()
         .x(function (d) { return x2(d[0]); })
         .y(function (d) { return y2(d[1]); });

      //@OLD
      d3.select('#' + this.uniqueId).selectAll('*').remove();

      const tooltip = d3.select('#' + this.uniqueId).append('div')
         .attr('class', 'tooltip')
         .style('opacity', 0);

      const svg = d3.select('#' + this.uniqueId)
         .append('svg')
         .attr('viewBox', '0 0 ' + container.width + ' ' + container.height)
         .on('dblclick', function () {
            self.broadcast(self.brushedBegin, self.brushedEnd);
         })
         .append('g')
         .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      //@END OLD
      const clip = svg.append("defs").append("svg:clipPath")
         .attr("id", "clip")
         .append("svg:rect")
         .attr("width", width)
         .attr("height", height)
         .attr("x", 0)
         .attr("y", 0);

      let classSpan = 'nb-badge-custom';

      svg.append("text")
         .attr("id", "click-to-update")
         .attr('fill','#717c95')
         .style("font-weight", "bold")
         .style("font-size", "1.1rem")
         .attr("dx", 10)
         .attr("dy", "0em")
         .attr("cursor", "move")
         .text("Atualizar")
         .on('click', function () {
            self.broadcast(self.brushedBegin, self.brushedEnd);
         });
      svg.append("text")
         .attr("id", "date-from")
         .text("")
         .attr('fill','#717c95')
         .style("font-weight", "bold")
         .style("font-size", "1rem")
         .attr("dx", width-200)
         .attr("dy", "0.1em");
      svg.append("text")
         .text(" - ")
         .attr('fill','#717c95')
         .style("font-weight", "bold")
         .attr("dx", width-105)
         .attr("dy", "0.1em");
      svg.append("text")
         .attr("id", "date-to")
         .text("")
         .attr('fill','#717c95')
         .style("font-weight", "bold")
         .style("font-size", "1rem")
         .attr("dx", width-90)
         .attr("dy", "0.1em");

      const Line_chart = svg.append("g")
         .attr("class", "focus")
         .attr("transform", "translate(0,0)")
         .attr("clip-path", "url(#clip)");

      const focus = svg.append("g")
         .attr("class", "focus")
         .attr("transform", "translate(0,0)");

      // Mini Graph
      const context = svg.append("g")
         .attr("class", "context")
         .attr("transform", "translate(0," + String(margin2.top - 20) + ")");

      if (this.data.length == 0) {
         return;
      }

      // scale the range of the data
      // x.domain([curr_lower_bound, curr_upper_bound]);
      let yDomain = d3.extent<number, number>(this.dataWihtoutInterval, (d) => d[1]);
      yDomain[1] += (Math.abs(yDomain[1] - Math.abs(yDomain[0])) * 0.10);
      yDomain[0] -= (Math.abs(yDomain[1] - Math.abs(yDomain[0])) * 0.10);

      x.domain(d3.extent<number, number>(this.dataWihtoutInterval, (d) => d[0]));
      x2.domain(x.domain());
      y.domain(yDomain);
      y2.domain(y.domain());

      let colorScale;
      if (self.range == 'outlier') {
         colorScale = d3.scaleThreshold<number, string>()
            .domain([0.5, 0.9, 1])
            .range(this.range_map.outlier);
      } else {
         colorScale = d3.scaleQuantize<string>()
            .domain(d3.extent<number, number>(this.dataWihtoutInterval, (d) => d[1]))
            .range(this.range_map.normal);
      }

      let colorData = [];
      if (self.range == 'outlier') {
         colorData.push({ offset: "0%", color: d3.rgb(colorScale(0)).toString() });
         colorData.push({ offset: "40%", color: d3.rgb(colorScale(0.5)).toString() });
         colorData.push({ offset: "60%", color: d3.rgb(colorScale(0.9)).toString() });
         colorData.push({ offset: "100%", color: d3.rgb(colorScale(1.0)).toString() });
      } else {
         let stride_offset = 100 / this.range_map.normal.length;
         let stride_color = (yDomain[1] - yDomain[0]) / this.range_map.normal.length;

         let curr_offset = 0;
         let curr_color = yDomain[0];

         for (let i = 0; i < this.range_map.normal.length; ++i) {
            colorData.push({ offset: curr_offset + '%', color: d3.rgb(colorScale(curr_color)).toString() });
            curr_offset += stride_offset;
            curr_color += stride_color;
         }

         // 100%
         colorData.push({ offset: '100%', color: d3.rgb(colorScale(yDomain[1])).toString() });
      }


      // set the gradient
      Line_chart.append("linearGradient")
         .attr("id", "line-gradient")
         .attr("gradientUnits", "userSpaceOnUse")
         .attr("x1", 0).attr("y1", y(yDomain[0]))
         .attr("x2", 0).attr("y2", y(yDomain[1]))
         .selectAll("stop")
         .data(colorData)
         .enter().append("stop")
         .attr("offset", (d) => {
            return d.offset;
         })
         .attr("stop-color", (d) => {
            return d.color;
         });

      // add the valueline path
      // svg.append('path')
      Line_chart.append('path')
         .data([this.dataWihtoutInterval])
         .attr('class', 'line')
         .attr('d', line)
         .attr('stroke-width', '1.0px');
      Line_chart.selectAll(".dot")
         .data(this.data)
         .enter().append("circle") // Uses the enter().append() method
         .attr("class", "dot") // Assign a class for styling
         .attr("cx", function(d) { return x(d[0]) })
         .attr("cy", function(d) { return y(d[1]) })
         .attr("r", 3)
         .on('mouseover', function (d) {
            tooltip.transition().duration(200).style('opacity', 0.95);
            tooltip.html(`Data: <span>${d3.timeFormat("%m/%d/%Y")(d[0])}</span><br>value: <span>${d3.format(",")(d[1])}</span>`)
               .style('left', `${d3.event.layerX - 120}px`)
               .style('top', `${d3.event.layerY-10}px`);
         })
         .on('mouseout', function (d) {
            tooltip.transition().duration(500).style('opacity', 0);
         });


      context.append('path')
         .data([this.dataWihtoutInterval])
         .attr('class', 'line')
         .attr('d', line2)
         .attr('stroke-width', '1.0px');

      context.append("g")
         .attr("class", "axis axis--x")
         .attr("transform", "translate(0," + height2 + ")")
         .call(xAxis2);

      context.append("g")
         .attr("class", "brush")
         .call(deactivateBroadcast)
         .call(brush)
         // .call(brush.move, x.range());
         .call(brush.move, [x2(this.data[0][0]), x2(this.data[this.data.length-1][0])]).call(activateBroadcast);

      svg.append("rect")
         .attr("class", "zoom")
         .attr("width", width)
         .attr("height", height)
         // .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
         .attr("transform", "translate(0,0)")
         .call(deactivateBroadcast)
         .call(zoom)
         .call(activateBroadcast);

      // add the X axis
      focus.append('g')
         .attr("class", "axis axis--x")
         .attr('transform', 'translate(0,' + height + ')')
         .call(xAxis);

      // add the Y axis
      focus.append('g')
         .attr("class", "axis axis--y")
         .call(yAxis);

      // labels
      svg.append('text').attr('id', 'labelXAxis');
      svg.append('text').attr('id', 'labelYAxis');

      // // text labels for the x axis
      // xAxis(svg.select('.xAxis'));


      svg.select('#labelXAxis')
         .attr('x', (width / 2.0))
         .attr('y', height + margin.bottom)
         .attr('fill','#717c95')
         .style('text-anchor', 'middle')
         .style('font-weight', 'bold')
         .text(this.xLabel.toUpperCase());

      // text labels for the x axis
      xAxis2(svg.select('.xAxis2'));
      svg.select('#labelXAxis2')
         .attr('x', (width / 2.0))
         .attr('y', height2 + margin2.bottom)
         .attr('fill','#717c95')
         .style('text-anchor', 'middle')
         .style('font-weight', 'bold')
         .text(this.xLabel.toUpperCase());

      // text label for the y axis
      yAxis(svg.select('.yAxis'));
      svg.select('#labelYAxis')
         .attr('transform', 'rotate(-90)')
         .attr('y', - (margin.left))
         .attr('x', - (height / 2))
         .attr('dy', '1em')
         .attr('fill','#717c95')
         .style('text-anchor', 'middle')
         .style('font-weight', 'bold')
         .text(this.yLabel.toUpperCase());

      function activateBroadcast(){
         self.reloadData = true;
      }
      function deactivateBroadcast(){
         self.reloadData = false;
      }

      function brushed() {
         // if (d3.event.sourceEvent && (d3.event.sourceEvent.type === "zoom" || d3.event.sourceEvent.type === "mousemove")) return; // ignore brush-by-zoom and mouse event
         if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom and mouse event
         var s = d3.event.selection || x2.range();
         svg.select("#date-from").text(x2.invert(s[0]).toLocaleDateString("pt-BR"));
         svg.select("#date-to").text(x2.invert(s[1]).toLocaleDateString("pt-BR"));
         if (d3.event.sourceEvent && d3.event.sourceEvent.type === "mousemove") return;
         self.brushedBegin = x2.invert(s[0]);
         self.brushedEnd = x2.invert(s[1]);
         // self.broadcast(x2.invert(s[0]), x2.invert(s[1])); //Only called when is changed in web!

         x.domain(s.map(x2.invert, x2));
         Line_chart.select(".line").attr("d", line);
         focus.select(".axis--x").call(xAxis);
         svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(width / (s[1] - s[0]))
            .translate(-s[0], 0));
      }

      /*function zoomed() {
         if (d3.event.sourceEvent && (d3.event.sourceEvent.type === "brush" || d3.event.sourceEvent.type === "mousemove")) return; // ignore zoom-by-brush
         var t = d3.event.transform;
         // console.log('t: ', t);
         self.broadcast(t.rescaleX(x2).domain()[0], t.rescaleX(x2).domain()[1]); //Only called when is changed in web!
         x.domain(t.rescaleX(x2).domain());
         Line_chart.select(".line").attr("d", line);
         focus.select(".axis--x").call(xAxis);
         context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
      }*/
   };

   ngAfterViewInit() {
      window.addEventListener('resize', this.loadWidget);
      this.loadWidget();
   }

   ngOnDestroy() {
      window.removeEventListener('resize', this.loadWidget);
   }
}
