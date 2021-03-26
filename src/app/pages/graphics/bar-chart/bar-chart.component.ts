import { Component, ViewChild, OnInit, ElementRef, AfterViewInit, Input, ViewEncapsulation, OnDestroy } from '@angular/core';

import { Widget } from '../../../widget';

import * as d3 from 'd3';
import { Subject } from 'rxjs/Subject';
import { DataService } from '../../../services/data.service';
import { ConfigurationService } from '../../../services/configuration.service';
import { SchemaService } from '../../../services/schema.service';
import { ActivatedRoute } from '@angular/router';
import {LocalDataSource} from "ng2-smart-table";

@Component({
   selector: 'app-bar-chart',
   encapsulation: ViewEncapsulation.None,
   templateUrl: './bar-chart.component.html',
   styleUrls: ['./bar-chart.component.scss']
})
export class BarChartComponent implements Widget, OnInit, AfterViewInit, OnDestroy {
   uniqueId = 'id-' + Math.random().toString(36).substr(2, 16);

   dataset: any;
   data = [];
   dim = '';
   subject = new Subject<any>();
   callbacks: any[] = [];
   selectedElts = new Array<string>();
   haveMinSlider = false;
   hiddenKeys = [];
   minValue = 0;
   maxValue = 1;
   count = 0;
   maxCount = 0;
   countCallbacks: any[] = [];
   maxCountCallbacks: any[] = [];

   xLabel = '';
   yLabel = '';
   yFormat = d3.format('.2s');

   range_map = {
      //'normal': ['#ffffd9','#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#253494','#081d58'],
      'category10': ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
      // 'category10': ['#FFD05D', '#FFA85E', '#FF826C', '#EF637D', '#CA4F8C', '#A15498', '#845798','#685893', '#455581', '#2F4858'],
      // 'category10': ['#FFD05D', '#FF826C', '#F2827B', '#EF637D', '#C75E94', '#A15498', '#A273B6', '#685893', '#455581', '#2F4858'],
      'category20': ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', '#8c564b', '#c49c94' , '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5'],
      // 'category20': ['#FFD05D', '#FFA85E', '#FF826C', '#FE8A7F', '#F2827B', '#F37686', '#EF637D', '#CA4F8C', '#C75E94', '#C36196', '#A15498', '#9768AB', '#A273B6', '#845798', '#685893', '#505A7D', '#455581', '#3E5477', '#2F4858'],
      'category20c': ['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#e6550d', '#fd8d3c', '#fdae6b', '#fdd0a2', '#31a354', '#74c476', '#a1d99b', '#c7e9c0', '#756bb1', '#9e9ac8', '#bcbddc', '#dadaeb', '#636363', '#969696', '#bdbdbd', '#d9d9d9'],
      'outlier': ['rgb(215,25,28)', 'rgb(253,174,97)', 'rgb(255,255,191)'].reverse()
   };

   tableSettings = {
      actions: false,
      hideSubHeader: true,
      columns: {
         desc: {
            title: "Descrição",
            type: "string",
            filter: false,
            width: '50%'
         },
         value: {
            title: "Valor",
            type: "html",
            filter: false,
            width: '50%',
            valuePrepareFunction: (value) => { return "<div class='text-right'>" + this.formatThousandsSeperator(value) + "</div>";},
         }
      },
      pager: {
         display: false
      }
   };
   tableSource: LocalDataSource = new LocalDataSource();

   constructor(private dataService: DataService,
      private configService: ConfigurationService,
      private schemaService: SchemaService,
      private activatedRoute: ActivatedRoute) {
      this.activatedRoute.params.subscribe(params => {
         const param = params['dataset'];
         if (param !== undefined) {
            this.dataset = this.schemaService.get(param);
         } else {
            this.dataset = this.schemaService.get(this.configService.defaultDataset);
         }
      });

      this.subject.subscribe(term => {
         this.dataService.query(term).subscribe(data => {
            this.data = data[0];
            if (this.haveMinSlider) {
               this.hiddenKeys = [];
               this.maxCount = this.data.length;
               this.data = this.data.filter(element => {
                  const self = this;
                  if (element[1] >= self.minValue && element[1] < self.maxValue) {
                     return true;
                  }
                  else {
                     return false;
                  }
               });
               this.count = this.data.length;
               if (this.data.length > 200) {
                  this.data = this.data.slice(0, 200);
               }
               for (var i = 0; i < this.data.length; i++ ) {
                  this.hiddenKeys.push(this.data[i][0]);
               }
               for (var i = 0; i < this.data.length; i++ ) {
                  this.data[i][0] = i;
               }
            }
            this.loadWidget();
         });
      });
   }

   ngOnInit() { }

   getDim() {
      return this.dim;
   }

   setMinValue(minValue) {
      this.minValue = minValue;
   }

   setMaxValue(maxValue) {
      this.maxValue = maxValue;
   }

   getCount() {
      return this.count;
   }

   getMaxCount() {
      return this.maxCount;
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

   setDataset(dataset: string) {
      this.dataset = this.schemaService.get(dataset);
   }

   setNextTerm(query: string) {
      this.subject.next(query);
   }

   setHaveMinSlider(haveMinSlider: boolean) {
      this.haveMinSlider = haveMinSlider;
   }

   setSelectedElts(selected) {
      this.clearSelectedElts();
      for (const d of selected) {
         if (this.haveMinSlider) {
            this.selectedElts.push(this.hiddenKeys[d]);
         }
         else {
            this.selectedElts.push(d);
         }
      }
   }

   getSelectedEltsIfExist() {
      if (!this.haveMinSlider) {
         return this.selectedElts;
      }
      var selected = [];
      for (var i = 0; i < this.selectedElts.length; i++) {
         if (this.hiddenKeys.includes(this.selectedElts[i])) {
            selected.push(this.hiddenKeys.indexOf(this.selectedElts[i]));
         }
      }
      return selected;
   }

   clearSelectedElts() {
      this.selectedElts = new Array<string>();
   }

   register(dim: string, callback: any): void {
      this.dim = dim;
      this.callbacks.push({ dim, callback });
   }

   unregister(callback: any): void {
      this.callbacks = this.callbacks.filter(el => el.callback !== callback);
   }

   broadcast(): void {
      for (const pair of this.callbacks) {
         pair.callback(pair.dim, this.selectedElts);
      }
   }

   registerCount(dim: string, callback: any): void {
      this.countCallbacks.push({ dim, callback });
   }

   unregisterCount(callback: any): void {
      this.countCallbacks = this.countCallbacks.filter(el => el.callback != callback);
   }

   broadcastCount(): void {
      for (const pair of this.countCallbacks) {
         pair.callback(pair.dim, this.getCount());
      }
   }

   registerMaxCount(dim: string, callback: any): void {
      this.maxCountCallbacks.push({ dim, callback });
   }

   unregisterMaxCount(callback: any): void {
      this.maxCountCallbacks = this.maxCountCallbacks.filter(el => el.callback != callback);
   }

   broadcastMaxCount(): void {
      for (const pair of this.maxCountCallbacks) {
         pair.callback(pair.dim, this.getMaxCount());
      }
   }

   getAliases() {
      if (!this.haveMinSlider) {
         return this.dataset.aliases[this.dim];
      }
      var aliases = [];
      for (var i = 0; i < this.dataset.aliases[this.dim].length; i++) {
         if (this.hiddenKeys.includes(i)) {
            aliases.push(this.dataset.aliases[this.dim][i]);
         }
      }
      return aliases;
   }

   getAliasesDesc() {
      if (this.dataset.aliases[this.dim + "_desc"] == undefined) {
         return this.getAliases();
      }
      if (!this.haveMinSlider) {
         return this.dataset.aliases[this.dim + "_desc"];
      }
      var aliases = [];
      for (var i = 0; i < this.dataset.aliases[this.dim + "_desc"].length; i++) {
         if (this.hiddenKeys.includes(i)) {
            aliases.push(this.dataset.aliases[this.dim + "_desc"][i]);
         }
      }
      return aliases;
   }

   loadTable() {
      let tableRows = [];
      let descColumn = this.dataset.aliases[this.dim];

      if(typeof this.dataset.aliases[this.dim+"_desc"] !== "undefined")
         descColumn = this.dataset.aliases[this.dim+"_desc"];
      for(var i=0; i<this.data.length; i++){
         tableRows.push({desc: descColumn[this.data[i][0]], value: this.data[i][1]})
      }
      this.tableSource.load(tableRows);
   }

   loadWidget = () => {
      const self = this;
      let container = (d3.select('#' + this.uniqueId).node() as any);

      if (container == (undefined || null) || container.parentNode == (undefined || null)) {
         return;
      }
      container = container.parentNode.getBoundingClientRect();
      const margin = { top: 5, right: 5, bottom: 35, left: 35 };
      const width = container.width - margin.left - margin.right;
      const height = container.height - margin.top - margin.bottom;
      if(width<10) return;
      this.data = <[[number, number]]>this.data.sort((lhs, rhs) => {
         return lhs[0] - rhs[0];
      });
      // set the ranges
      const x = d3.scaleBand()
         .padding(0.025);

      if (self.haveMinSlider && this.data.length > 20) {
         x.range([0, width + 28 * (this.data.length - 20)]);
      }
      else {
         x.range([0, width]);
      }

      const y = d3.scaleLinear<number, number>()
         .range([height, 0]);

      d3.select('#' + this.uniqueId).selectAll('*').remove();

      const svg = d3.select('#' + this.uniqueId)
         .append('svg')
         .attr('viewBox', '0 0 ' + container.width + ' ' + container.height)
         .attr('class', 'eh-graph-categorical-inside')
         .append('g')
         .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      let defs = svg.append('svg').attr('width', 0).attr('height', 0).append('defs');
      defs.append('clipPath').attr('id', 'clipper').append('rect').attr('x', 0).attr('y', 0).attr('width', width).attr('height', height);

      let defs_x = svg.append('svg').attr('width', 0).attr('height', 0).append('defs');
      defs_x.append('clipPath').attr('id', 'clipper_x').append('rect').attr('x', 0).attr('y', height).attr('width', width).attr('height', margin.bottom);

      let yDomain = d3.extent<number, number>(this.data, (d) => d[1]);
      yDomain[0] -= (Math.abs(yDomain[1] - Math.abs(yDomain[0])) * 0.15);
      // yDomain[1] += (Math.abs(yDomain[1] - Math.abs(yDomain[0])) * 0.25);

      if (yDomain[0] == yDomain[1]) {
         yDomain[0] -= (Math.abs(yDomain[0]) * 0.10);
      }

      // yDomain[0] = Math.max(yDomain[0], 0);
      yDomain[0] = 0;

      // scale the range of the data
      x.domain(this.getAliases());
      y.domain(yDomain);

      let colorScale;
      let colorDomain = [];
      for (var i = 0; i < this.data.length; i++ ) {
         colorDomain[i] = this.data[i][0];
      }
      if (this.getAliases().length <= 10) {
         colorScale = d3.scaleOrdinal()
            .domain(colorDomain)
            .range(this.range_map.category10);
      }
      else {
         colorScale = d3.scaleOrdinal()
            .domain(colorDomain)
            .range(this.range_map.category20);
      }

      let getColor = (d) => {
         if (self.getSelectedEltsIfExist().find((elt) => elt === d[0]) !== undefined) {
            return d3.rgb(colorScale(d[0]));
         }
         else {
            if (self.selectedElts.length !== 0) {
               // return d3.rgb(colorScale(d[0])).brighter(0.9);
               return d3.rgb('lightgray');
            }
            else {
               return d3.rgb(colorScale(d[0]));
            }
         }
      };

      if (self.haveMinSlider && this.data.length > 20) {
         let zoom = d3.zoom().scaleExtent([1, 1]).on('zoom', function() {
            let tx;
            tx = d3.event.transform.x;
            if (x.range()[1] === width) {
               return;
            }
            if ((x.range()[1] - width) + tx > 0 && tx <= 0) {
               svg.select('.group_xaxis').attr('transform', `translate(${tx}, ${height})`);
               svg.selectAll('.group_bar').attr('transform', `translate(${tx}, 0)`);
               return;
            }
         });
         svg.append('rect').attr('fill', 'lightblue').attr('cursor', 'ew-resize').attr('width', width).attr('height', height).call(zoom);
      }

      const tooltip = d3.select('#' + this.uniqueId).append('div')
         .attr('class', 'tooltip')
         .style('opacity', 0);

      let svg_data = svg.append('g').attr('clip-path', 'url(#clipper)');

      // Tooltip on background
      svg_data.selectAll('bar')
         .data(this.data)
         .enter().append('rect')
         .attr('fill', '#FFFFFF')
         .attr('x', d => x(this.getAliases()[d[0]]))
         .attr('width', x.bandwidth())
         .attr('y', 0)
         .attr('height', height)
         .attr('class', 'group_bar')
         .on('mouseover', function (d) {
            if (self.getSelectedEltsIfExist().find((elt) => elt === d[0]) !== undefined) {
               d3.select(this).attr('fill', d3.rgb('#FFFFFF').darker(0.2).toString());
            } else {
               d3.select(this).attr('fill', d3.rgb('#FFFFFF').darker(0.2).toString());
            }
            tooltip.transition().duration(200).style('opacity', 0.95);
            tooltip.html(`${self.dim}: <span>${(self.getAliasesDesc()[d[0]])}</span><br>value: <span>${d3.format(",")(d[1])}</span>`)
               .style('left', `${d3.event.layerX - 120 * (d[0] / self.data.length)}px`)
               .style('top', `${d3.event.layerY-10}px`);
         })
         .on('mouseout', function (d) {
            d3.select(this).attr('fill', '#ffffff');
            tooltip.transition().duration(500).style('opacity', 0);
         })
         .on('click', function (d) {
            if (self.haveMinSlider) {
               let found = self.selectedElts.find(el => el === self.hiddenKeys[d[0]]) !== undefined;
               if (found) {
                  self.selectedElts = self.selectedElts.filter(el => el !== self.hiddenKeys[d[0]]);
                  self.removeLabel(d[0]);
               }
               else {
                  self.selectedElts.push(self.hiddenKeys[d[0]]);
                  self.addLabel(d[0], self.getAliasesDesc()[d[0]], self);
               }
            }
            else {
               let found = self.selectedElts.find(el => el === d[0]) !== undefined;
               if (found) {
                  self.selectedElts = self.selectedElts.filter(el => el !== d[0]);
                  self.removeLabel(d[0]);
               }
               else {
                  self.selectedElts.push(d[0]);
                  self.addLabel(d[0], self.getAliasesDesc()[d[0]], self);
               }
            }
            // broadcast
            self.broadcast();
         });

      svg_data.selectAll('bar')
         .data(this.data)
         .enter().append('rect')
         .attr('fill', (d) => {
            let color = getColor(d);
            return color.toString();
         })
         .attr('x', d => x(this.getAliases()[d[0]]))
         .attr('width', x.bandwidth())
         .attr('y', (d) => y(d[1]))
         .attr('height', (d) => height - y(d[1]))
         .attr('class', 'group_bar')
         .on('mouseover', function (d) {
            if (self.getSelectedEltsIfExist().find((elt) => elt === d[0]) !== undefined) {
               d3.select(this).attr('fill', d3.rgb(colorScale(d[0])).darker(2.0).toString());
            } else {
               d3.select(this).attr('fill', d3.rgb(colorScale(d[0])).darker().toString());
            }
            tooltip.transition().duration(200).style('opacity', 0.95);
            tooltip.html(`${self.dim}: <span>${(self.getAliasesDesc()[d[0]])}</span><br>value: <span>${d3.format(",")(d[1])}</span>`)
               .style('left', `${d3.event.layerX - 120 * (d[0] / self.data.length)}px`)
               .style('top', `${d3.event.layerY-10}px`);
         })
         .on('mouseout', function (d) {
            d3.select(this).attr('fill', getColor(d).toString());
            tooltip.transition().duration(500).style('opacity', 0);
         })
         .on('click', function (d) {
            if (self.haveMinSlider) {
               let found = self.selectedElts.find(el => el === self.hiddenKeys[d[0]]) !== undefined;
               if (found) {
                  self.selectedElts = self.selectedElts.filter(el => el !== self.hiddenKeys[d[0]]);
                  self.removeLabel(d[0]);
               }
               else {
                  self.selectedElts.push(self.hiddenKeys[d[0]]);
                  self.addLabel(d[0], self.getAliasesDesc()[d[0]], self);
               }
            }
            else {
               let found = self.selectedElts.find(el => el === d[0]) !== undefined;
               if (found) {
                  self.selectedElts = self.selectedElts.filter(el => el !== d[0]);
                  self.removeLabel(d[0]);
               }
               else {
                  self.selectedElts.push(d[0]);
                  self.addLabel(d[0], self.getAliasesDesc()[d[0]], self);
               }
            }

            // reset color
            d3.select(this).attr('fill', getColor(d).toString());

            svg.selectAll(".group_bar").attr("fill", function (d) {
               let color = getColor(d);
               return color.toString();
            });

            // broadcast
            self.broadcast();
         });

      // add the X axis
      const xAxis = d3.axisBottom(x);
      svg.append('g')
         .attr('clip-path', 'url(#clipper_x)')
         .append('g')
         .attr('transform', 'translate(0,' + height + ')')
         .attr('class', 'group_xaxis')
         .call(xAxis);

      // text label for the x axis
      svg.append('text').attr('id', 'labelXAxis');
      xAxis(svg.select('.xAxis'));
      svg.select('#labelXAxis')
         .attr('x', (width / 2.0))
         .attr('y', height + margin.bottom - 2)
         .style('text-anchor', 'middle')
         .style('font-weight', 'bold')
         .attr('fill','#717c95')
         .text(this.xLabel.toUpperCase());

      // add the Y axis
      const yAxis = d3.axisLeft(y)
         .tickFormat(self.yFormat);
      svg.append('g')
         .call(yAxis);

      if (this.yLabel != "") {
         svg.append('text').attr('id', 'labelYAxis');
         // text label for the y axis
         yAxis(svg.select('.yAxis'));
         svg.select('#labelYAxis')
            .attr('transform', 'rotate(-90)')
            .attr('y', - (margin.left))
            .attr('x', - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text(this.yLabel);
      }

      self.broadcastCount();
      self.broadcastMaxCount();

      self.loadTable();
   };

   addLabel(id, desc, self){
      let labelParent = d3.select('#filter'+self.dim);
      let classSpan = 'nb-badge-custom';
      if(labelParent.empty()){
         /*if(d3.selectAll(".filter-field").size()%2==1){
            classSpan = 'nb-badge-gray';
         }*/
         d3.select('#filters')
            .append('div').attr('id', 'filter'+self.dim)//.attr('color-class', classSpan).attr('class', 'filter-field')
            .append('text').text(self.xLabel + ':\ ').style('color', '#717c95').style('padding', '0.25rem 0.05rem');
      }
      const filter = d3.select('#filter'+self.dim).append('span')
         // .attr('class', d3.select('#filter'+self.dim).attr('color-class'))
         .attr('class', classSpan)
         .attr('id', self.dim+id).text(desc+'\u00A0\u00A0');
      filter.append('svg').attr('width', 10).attr('height', 10)
         .on('mouseover', function(){
            d3.select(this).style('cursor', 'pointer');
         })
         .on('mouseout', function(){
            d3.select(this).style('cursor', 'default');
         })
         .on('click', function () {
            self.selectedElts = self.selectedElts.filter(el => el !== id);
            self.broadcast();
            self.removeLabel(id);
         }).append('g')
         .append('path').attr('d', 'M 0 0 L 9 9 M 0 9 L 9 0').attr('stroke','white').attr('stroke-width', 2);
   }
   removeLabel(id) {
      d3.select('#' + this.dim + id).remove();
      let labelParent = d3.select('#filter' + this.dim + ' span');
      if (labelParent.empty()) {
         d3.select('#filter' + this.dim).remove();
      }
   }


   ngAfterViewInit() {
      window.addEventListener('resize', this.loadWidget);
      this.loadWidget();
   }

   ngOnDestroy() {
      window.removeEventListener('resize', this.loadWidget);
   }

   formatThousandsSeperator(n) {
      return d3.format(",")(n);
   }
}
