import { Component, ViewChild, OnInit, ElementRef, AfterViewInit, Input, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';

import { Widget } from '../widget';

import * as d3 from 'd3';
import * as moment from 'moment';

import { Subject } from 'rxjs/Subject';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-line-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css']
})
export class LineChartComponent implements Widget, OnInit, AfterViewInit {
  uniqueId = 'id-' + Math.random().toString(36).substr(2, 16);

  data = [];
  dim = '';
  subject = new Subject<any>();
  callbacks: any[] = [];

  options: FormGroup;

  constructor(fb: FormBuilder, private dataService: DataService) {
    this.options = fb.group({
      fromDateTime: new FormControl(Date.now()),
      toDateTime: new FormControl(Date.now())
    });
  }

  ngOnInit() {
    this.subject.subscribe(term => {
      this.dataService.query(term).subscribe(data => {
        this.data = data[0];

        // format the data
        this.data.forEach(function (d) {
          d[0] = new Date(d[0] * 1000);
        });

        this.loadWidget();
      });
    });
  }

  setNextTerm(query: string) {
    this.subject.next(query);
  }

  setBound(lower, upper) {
    const from = new Date(lower * 1000);
    from.setHours(0, 24 * 60, 0, 0);

    const to = new Date(upper * 1000);
    to.setHours(0, 24 * 60, 0, 0);

    this.options.patchValue({
      fromDateTime: from,
      toDateTime: to,
    });
  }

  register(dim: string, callback: any): void {
    this.callbacks.push({ dim, callback });
  }

  unregister(callback: any): void {
    this.callbacks = this.callbacks.filter(el => el.callback !== callback);
  }

  broadcast(): void {
    const interval = [
      this.options.get('fromDateTime').value.valueOf() / 1000 - 7200,
      this.options.get('toDateTime').value.valueOf() / 1000 - 7200
    ];
    console.log(interval);
    for (const pair of this.callbacks) {
      pair.callback(pair.dim, interval);
    }
  }

  loadWidget = () => {
    const container = (d3.select('#' + this.uniqueId).node() as any).parentNode.getBoundingClientRect();

    const margin = { top: 5, right: 5, bottom: 65, left: 50 };
    const width = container.width - margin.left - margin.right;
    const height = container.height - margin.top - margin.bottom;

    const x = d3.scaleUtc<number, number>()
      .range([0, width]);

    const y = d3.scaleLinear<number, number>()
      .range([height, 0]);

    // define area
    const area = d3.area()
      .x(function (d) { return x(d[0]); })
      .y0(height)
      .y1(function (d) { return y(d[1]); });

    // define line
    const line = d3.line()
      .x(function (d) { return x(d[0]); })
      .y(function (d) { return y(d[1]); });


    d3.select('#' + this.uniqueId).selectAll('*').remove();


    const svg = d3.select('#' + this.uniqueId)
      .append('svg')
      .attr('viewBox', '0 0 ' + container.width + ' ' + container.height)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // scale the range of the data
    // x.domain([curr_lower_bound, curr_upper_bound]);
    x.domain(d3.extent<number, number>(this.data, function (d) { return d[0]; }));
    y.domain([0, d3.max<number, number>(this.data, function (d) { return d[1]; })]);

    // add the area
    svg.append('path')
      .data([this.data])
      .attr('class', 'area')
      .attr('d', area)
      .attr('fill', 'lightsteelblue');

    // add the valueline path
    svg.append('path')
      .data([this.data])
      .attr('class', 'line')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', '1.5px');

    // add the X axis
    const xAxis = d3.axisBottom(x);
    svg.append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);

    // add the Y axis
    const yAxis = d3.axisLeft(y);
    svg.append('g')
      .call(yAxis);
  }

  ngAfterViewInit() {
    window.addEventListener('resize', this.loadWidget);
  }
}
