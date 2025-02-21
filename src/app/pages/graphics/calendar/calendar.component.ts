import { Component, ViewChild, OnInit, ElementRef, AfterViewInit, Input, ViewEncapsulation, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';

import { Widget } from '../../../widget';

import * as d3 from 'd3';
import * as moment from 'moment';
import { legendColor } from 'd3-svg-legend';

import { Subject } from 'rxjs/Subject';
import { DataService } from '../../../services/data.service';
import { SchemaService } from '../../../services/schema.service';
import { TimezoneService } from '../../../services/timezone.service';

@Component({
   selector: 'app-calendar',
   encapsulation: ViewEncapsulation.None,
   templateUrl: './calendar.component.html',
   styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements Widget, OnInit, AfterViewInit, OnDestroy {
   uniqueId = 'id-' + Math.random().toString(36).substr(2, 16);

   dataset: any;
   data: any;
   dim = '';
   subject = new Subject<any>();
   callbacks: any[] = [];

   xLabel = '';
   yLabel = '';
   yFormat = d3.format('.2f');

   yearList = [];

   yearIni = 0;
   yearEnd = 0;

   options: FormGroup;

   private monthFormatter = d3.timeFormat('%b');
   private dateFormatter = d3.timeFormat('%Y-%m-%d');

   private min = Number.MAX_SAFE_INTEGER;
   private max = Number.MIN_SAFE_INTEGER;

   constructor(
      fb: FormBuilder,
      private timezoneService: TimezoneService,
      private schemaService: SchemaService,
      private dataService: DataService) {
      this.options = fb.group({
         selectedYear: new FormControl((new Date()).getFullYear())
         // fromDateTime: new FormControl(Date.now()),
         // toDateTime: new FormControl(Date.now())
      });

      this.subject.subscribe(term => {
         this.dataService.query(term).subscribe(data => {
            this.setData(data);
         });
      });
   }

   ngOnInit() { }

   setLowerUpper(lower: string, upper:string){
      let dateLower = new Date((parseInt(lower)+86400)*1000);
      let dateUpper = new Date((parseInt(upper)+86400)*1000);
      for(var i = dateLower.getFullYear(); i<= dateUpper.getFullYear(); i++){
         this.yearList.push(i);
      }
   }

   setXLabel(value: string) {
      this.xLabel = value;
   }

   setYLabel(value: string) {
      this.yLabel = value;
   }

   setFormatter(formatter: any) {
      this.monthFormatter = formatter;
   }

   setData(data) {
      let initialDate: Date;
      let finalDate: Date;

      if (data[0].length) {
         initialDate =  this.timezoneService.getDateFromSeconds(data[0][0][0]);
         finalDate = this.timezoneService.getDateFromSeconds(data[0][data[0].length - 1][0]);
      } else {
         initialDate = new Date();
         finalDate = new Date();
      }

      // setup data
      this.yearIni = initialDate.getUTCFullYear();
      this.yearEnd = finalDate.getUTCFullYear();
      this.options.patchValue({
         fromDateTime: initialDate,
         toDateTime: finalDate,
      });

      this.min = Number.MAX_SAFE_INTEGER;
      this.max = Number.MIN_SAFE_INTEGER;

      // format the data
      data[0].forEach(d => {
         d[0] = this.timezoneService.getDateFromSeconds(d[0]);
         d[0] = this.dateFormatter(d[0]);

         this.min = Math.min(this.min, d[1]);
         this.max = Math.max(this.max, d[1]);
      });

      this.data = d3.nest<string, number>()
         .key(d => d[0])
         .rollup(d => parseFloat(d[0][1]))
         .map(data[0]);

      this.loadLegend();
      this.loadWidget();
   }

   loadLegend() {
      const svg = d3.select('#svg-color-quant-' + this.uniqueId)
         .attr('transform', 'translate(-40, 20)');
      svg.selectAll('*').remove();

      svg.attr('class', 'svg-color-quant-calendar');

      svg.append('g')
         .attr('class', 'legendQuant')
         .attr('transform', 'translate(0, 0)');

      const domain: [number, number] = [this.min, this.max];

      const colorLegend = legendColor()
         .labelFormat(d3.format('.2f'))
         .orient('horizontal')
         .shapeWidth(100)
         .shapePadding(0)
         .shapeHeight(5)
         .scale(d3.scaleQuantize<string>().domain(domain).range(
            ['rgb(215,25,28)', 'rgb(253,174,97)', 'rgb(255,255,191)', 'rgb(171,217,233)', 'rgb(44,123,182)'].reverse()
         ));

      svg.select('.legendQuant')
         .call(colorLegend);
   }

   setDataset(dataset: string) {
      this.dataset = this.schemaService.get(dataset);
   }

   setNextTerm(query: string) {
      this.subject.next(query);
   }

   register(dim: string, callback: any): void {
      this.callbacks.push({ dim, callback });
   }

   unregister(callback: any): void {
      this.callbacks = this.callbacks.filter(el => el.callback !== callback);
   }

   broadcast(): void {
      for (const pair of this.callbacks) {
         pair.callback(this.options.get('selectedYear').value);
      }
   }

   loadWidget = () => {
      function getWeekNumber(d) {
         // Copy date so don't modify original
         d = new Date(+d);
         d.setHours(0, 0, 0);
         // Set to nearest Thursday: current date + 4 - current day number
         // Make Sunday's day number 7
         d.setDate(d.getDate() + 4 - (d.getDay() || 7));
         // Get first day of year
         const yearStart = new Date(d.getFullYear(), 0, 1);
         // Calculate full weeks to nearest Thursday
         const weekNo = Math.ceil((((d.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7);
         // Return array of year and week number
         return [d.getFullYear(), weekNo];
      }

      function weeksInYear(year) {
         const d = new Date(year, 11, 31);
         const week = getWeekNumber(d)[1];
         return week === 1 ? getWeekNumber(d.setDate(24))[1] : week;
      }

      if (this.data !== undefined) {
         const self = this;
         let container = (d3.select('#' + this.uniqueId).node() as any);

         if (container === undefined || container.parentNode === undefined) {
            return;
         }

         const weeksInMonth = (month) => {
            const m = d3.timeMonth.floor(month);
            return d3.timeWeeks(d3.timeWeek.floor(m), d3.timeMonth.offset(m, 1)).length;
         };

         container = container.parentNode.getBoundingClientRect();

         // const margin = { top: 5, right: 5, bottom: 75, left: 5 };
         const margin = { top: 5, right: 5, bottom: 185, left: 35 };
         const width = container.width - margin.left - margin.right;
         const height = container.height - margin.top - margin.bottom;

         let weekNumber = 52;
         // for(var i = this.yearIni; i < this.yearEnd; i++){
         //    weekNumber += weeksInYear(i);
         // }
         const cellWidth = width / (weekNumber + 1); // cell size
         const cellHeight = height / 6; // cell size

         const color = d3.scaleQuantize<string>()
            .domain([this.min, this.max])
            .range(['rgb(215,25,28)', 'rgb(253,174,97)', 'rgb(255,255,191)', 'rgb(171,217,233)', 'rgb(44,123,182)'].reverse());

         d3.select('#' + this.uniqueId).selectAll('*').remove();
         d3.select('#tooltip').remove();

         const svg = d3.select('#' + this.uniqueId)
         // .data(d3.range(this.year, this.year + 1))
            .data(d3.range(this.yearIni, this.yearEnd + 1))
            .append('svg')
            .attr('viewBox', '0 0 ' + container.width + ' ' + container.height)
            .attr('class', 'Spectral')
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

         // tooltip object
         const tooltip = d3.select('body')
            .append('div')
            .attr('id', 'tooltip')
            .style('position', 'absolute')
            // .style('z-index', '10')
            .style('visibility', 'hidden');

         const rect = svg.selectAll('.day')
            .data(function (d) { return d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
            .enter().append('rect')
            .attr('class', 'day')
            .attr('width', cellWidth - 1)
            .attr('height', cellHeight - 1)
            .attr('rx', 3)
            .attr('ry', 3) // rounded corners
            .attr('x', function (d) { return d3.timeWeek.count(d3.timeYear(d), d) * cellWidth; })
            .attr('y', function (d) { return d.getDay() * cellHeight; })
            .on('mouseover', (d) => {
               d3.select(d3.event.currentTarget).classed('hover', true);

               tooltip.style('visibility', 'visible');

               // tooltip.html(d + ': ' + this.yFormat(this.data.get(d)))
               tooltip.html(d + ': <span>' + this.yFormat(this.data.get(d))+'</span>')
                  .style('left', (d3.event.pageX) + 30 + 'px')
                  .style('top', (d3.event.pageY) + 'px');
            })
            .on('mouseout', (d) => {
               d3.select(d3.event.currentTarget).classed('hover', false);

               tooltip.style('visibility', 'hidden');
            })
            .datum(this.dateFormatter);

         const monthPath = (t0) => {
            const t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0);
            const d0 = t0.getDay();
            const w0 = d3.timeWeek.count(d3.timeYear(t0), t0);
            const d1 = t1.getDay();
            const w1 = d3.timeWeek.count(d3.timeYear(t1), t1);

            return 'M' + (w0 + 1) * cellWidth + ',' + d0 * cellHeight
               + 'H' + w0 * cellWidth + 'V' + 7 * cellHeight
               + 'H' + w1 * cellWidth + 'V' + (d1 + 1) * cellHeight
               + 'H' + (w1 + 1) * cellWidth + 'V' + 0
               + 'H' + (w0 + 1) * cellWidth + 'Z';
         };

         svg.selectAll('.month')
            .data(function (d) { return d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
            .enter().append('path')
            .attr('class', 'month')
            .attr('d', monthPath);

         svg.selectAll('.month-name')
            .data(function (d) { return d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
            .enter()
            .append('text')
            .attr('class', 'month-name')
            .attr('y', (cellHeight * 7) + (1 * 8) + 15)
            .attr('x', (d) => {
               const size = (width / 12);
               return (size * d.getMonth().valueOf()) + size / 2;
            })
            .attr('text-anchor', 'middle')
            .text((d) => this.monthFormatter(d));

         rect.filter(d => this.data.has(d))
            .style('fill', d => color(this.data.get(d)));
      }
   }


   ngAfterViewInit() {
      window.addEventListener('resize', this.loadWidget);
   }

   ngOnDestroy() {
      window.removeEventListener('resize', this.loadWidget);
   }
}
