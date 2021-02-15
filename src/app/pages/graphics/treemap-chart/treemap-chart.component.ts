import { Component, ViewChild, OnInit, ElementRef, AfterViewInit, Input, ViewEncapsulation, OnDestroy } from '@angular/core';

import { Widget } from '../../../widget';

import * as d3 from 'd3';
import { Subject } from 'rxjs/Subject';
import { DataService } from '../../../services/data.service';
import { ConfigurationService } from '../../../services/configuration.service';
import { SchemaService } from '../../../services/schema.service';
import { ActivatedRoute } from '@angular/router';
//import {forEach} from "@angular/router/src/utils/collection";

@Component({
  selector: 'app-treemap-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './treemap-chart.component.html',
  styleUrls: ['./treemap-chart.component.scss']
})
export class TreemapChartComponent implements Widget, OnInit, AfterViewInit, OnDestroy {
  uniqueId = 'id-' + Math.random().toString(36).substr(2, 16);

  dataset: any;
  data = [];
  dataJson = {};
  labelsDict = {};
  dim = '';
  subject = new Subject<any>();
  callbacks: any[] = [];
  selectedElts = new Array<string>();
  selectedEltsNames = new Array<string>();
  selectedEltsIds = new Array<string>();

  xLabel = '';
  yLabel = '';
  yFormat = d3.format('.2s');

  range_map = {
    //'normal': ['#ffffd9','#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#253494','#081d58'],
    'category10': ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
    'category20': ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#9467bd', '#c5b0d5', '#8c564b', '#c49c94' , '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', /*'#dbdb8d',*/ '#17becf', '#9edae5'],
    'category20c': ['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#e6550d', '#fd8d3c', '#fdae6b', '#fdd0a2', '#31a354', '#74c476', '#a1d99b', '#c7e9c0', '#756bb1', '#9e9ac8', '#bcbddc', '#dadaeb', '#636363', '#969696', '#bdbdbd', '#d9d9d9'],
    'outlier': ['rgb(215,25,28)', 'rgb(253,174,97)', 'rgb(255,255,191)'].reverse()
  }

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
        if(this.data.length > 0) {
          let arrPos = this.getTreemapAliases(this.dim+'_fixed');
          let dataTemp = [];
          let data = this.data;
          arrPos.forEach( function(el){
            let temp = data.find(function(element){ return element[0]==el;});
            if(typeof temp === 'undefined') dataTemp.push([el, 0]);
            else dataTemp.push(temp);
          });
          this.data = dataTemp;
          let names = this.getTreemapAliases(this.dim+'_names');
          let labels = this.getTreemapAliases(this.dim+'_labels');
          this.labelsDict = this.getTreemapAliases(this.dim+'_dict');
          this.dataJson = buildJsonHierarchy(this.getTreemapAliases(this.dim), this.data, names, labels, this.labelsDict);
          // @ts-ignore
          if(typeof this.dataJson.children === 'undefined' || this.dataJson.children.length == 0){
            this.dataJson = {"name": names[0], "shortName": names[1], "longName": names[1], "children": [{"name": 'Sim datos', "shortName": 'Sim dados', "longName": 'Sim dados', "size":-1, "arrOriginal": []}], "arrOriginal": []};
          }
        }
        this.loadWidget();
      });
    });

    function getElementsTree(element, data, names, labels, dict) {
      if (!Array.isArray(element)){
        if (typeof data[element] === 'undefined')
          return undefined;
        if( data[element][1]==0)
           return {"name": labels[element] + names[1], "shortName": labels[element] + names[2], "longName": labels[element] + names[2], "size": 0, "arrOriginal": undefined};
           // return {"name": labels[element] + names[1], "shortName": labels[element] + names[2], "longName": labels[element] + names[2], "size": undefined, "arrOriginal": undefined};
         if(typeof dict[labels[element]] === 'undefined')
            return {"name": labels[element] + names[0], "shortName": labels[element] + names[2], "longName": labels[element] + names[2], "size": data[element][1], "arrOriginal": [data[element]]};
         return {"name": labels[element] + names[0], "shortName": dict[labels[element]][0], "longName": dict[labels[element]][1], "size": data[element][1], "arrOriginal": [data[element]]};
      }
      let children = [];
      let arrOriginal = [];
       let strIni = '', strEnd = '';
       let tempI = true;
      element.forEach(function(el) {
        let temp = getElementsTree(el, data, names, labels, dict);
        if(!(typeof temp === 'undefined')) {
           if(tempI) {
              strIni = temp['name'].split(' ')[0].split('-')[0];
              tempI = false;
           }
           strEnd = temp['name'].split(' ')[0].split('-');
           strEnd = strEnd[strEnd.length-1];
           if(!(typeof temp.arrOriginal === 'undefined')) {
              children.push(temp);
              temp.arrOriginal.forEach( function(elementOriginal) { arrOriginal.push(elementOriginal); })
           }
        }``
      });
       // if(children.length==0) return undefined;
       if(children.length==0){
          if(strIni!=strEnd){
             if(typeof dict[strIni+'-'+strEnd] === 'undefined')
                return {"name": strIni + '-'+strEnd+names[0], "shortName": strIni + '-'+strEnd+names[2], "longName": strIni + '-'+strEnd+names[2],  "size": 0, "arrOriginal": undefined};
             return {"name": strIni + '-'+strEnd+names[0], "shortName": dict[strIni+'-'+strEnd][0], "longName": dict[strIni+'-'+strEnd][1],  "size": 0, "arrOriginal": undefined};
          }
          if(typeof dict[strIni] === 'undefined')
             return {"name": strIni + '-'+strEnd+names[0], "shortName": strIni + '-'+strEnd+names[2], "longName": strIni+names[2],  "size": 0, "arrOriginal": undefined};
          return {"name": strIni + names[0], "shortName": dict[strIni][0], "longName": dict[strIni][1], "size": 0, "arrOriginal": undefined};
          //return undefined;
       }

      if(strIni!=strEnd){
        if(typeof dict[strIni+'-'+strEnd] === 'undefined')
           return {"name": strIni + '-'+strEnd+names[0], "shortName": strIni + '-'+strEnd+names[2], "longName": strIni + '-'+strEnd+names[2],  "children": children, "arrOriginal": arrOriginal};
        return {"name": strIni + '-'+strEnd+names[0], "shortName": dict[strIni+'-'+strEnd][0], "longName": dict[strIni+'-'+strEnd][1],  "children": children, "arrOriginal": arrOriginal};
      }
      if(typeof dict[strIni] === 'undefined')
         return {"name": strIni + '-'+strEnd+names[0], "shortName": strIni + '-'+strEnd+names[2], "longName": strIni+names[2],  "children": children, "arrOriginal": arrOriginal};
      return {"name": strIni + names[0], "shortName": dict[strIni][0], "longName": dict[strIni][1], "children": children, "arrOriginal": arrOriginal};
    }


    function buildJsonHierarchy(mapTree, data, names, labels, dict){
      let children = [];
      mapTree.forEach(function(element) {
        let child = getElementsTree(element, data, names, labels, dict);
        if(!(typeof child === 'undefined')) children.push(child);
      });
      return {"name": names[0], "shortName": names[0], "longName": names[0], "children":children};
    }

  }

  ngOnInit() { }

  getDim() {
    return this.dim;
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

  getSelectedEltsIfExist() {
    return this.selectedElts;
  }

   setSelectedElts(selected) {
      this.clearSelectedElts();
      for (const d of selected) {
         this.selectedElts.push(d);
      }
   }

   clearSelectedElts() {
      this.selectedElts = new Array<string>();
      this.selectedEltsNames = new Array<string>();
      this.selectedEltsIds= new Array<string>();
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

  getTreemapAliases(dim) {
    return this.dataset.treemapAliases[dim];
  }

  loadWidget = () => {
    const self = this;
    let container = (d3.select('#' + this.uniqueId).node() as any);
    if (container == (undefined || null) || container.parentNode == (undefined || null)) {
      return;
    }

    container = container.parentNode.getBoundingClientRect();
    let grandparentHeight = Math.max(container.height/17, 12);
    grandparentHeight = Math.min(grandparentHeight, 25);

    const margin = { top: grandparentHeight, right: 5, bottom: 5, left: 5 };
    const width = container.width - margin.left - margin.right;
    const height = container.height - margin.top - margin.bottom;
    if(width<10) return;
    var formatNumber = d3.format(",d"),
      transitioning;
    var x = d3.scaleLinear()
      .domain([0, width])
      .range([0, width]);

    var y = d3.scaleLinear()
      .domain([0, height - margin.top - margin.bottom])
      .range([0, height - margin.top - margin.bottom]);

    var color = d3.scaleOrdinal()
      .range(this.range_map.category20);

    var treemap;
    var grandparent;
    var grandparentTitle;

    d3.select('#' + this.uniqueId).selectAll('*').remove();
    const svg = d3.select('#' + this.uniqueId)
      .append('svg')
      .attr('viewBox', '0 0 ' + container.width + ' ' + container.height)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

     svg.append('defs')
        .append('pattern')
        .attr('id', 'diagonalHatch')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 8)
        .attr('height', 8)
        .append('path')
        .attr('d', 'M0,4 4,0 M0,8 8,0 M4,8 8,4')
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 1);


    const tooltip = d3.select('#' + this.uniqueId).append('div')
      .attr('class', 'tooltipTree')
      .style('opacity', 0);

    grandparent = svg.append("g")
      .attr("class", "grandparent")
      .attr("height", margin.top);

    grandparentTitle = grandparent.append("rect")
      .attr("y", -margin.top+2)
      .attr("width", width)
      .attr("height", margin.top);

    grandparent.append("text")
      .attr("x", 6)
      .attr("y", -margin.top*0.3+2)
      .attr("font-size", margin.top*0.6);

    treemap = d3.treemap()
      .tile(d3.treemapResquarify.ratio(height / width * 0.5 * (1 + Math.sqrt(5))))
      .size([width, height])
      .round(false)
      .paddingInner(0.5);

    var root = d3.hierarchy(this.dataJson)
    // @ts-ignore
      .eachBefore(function(d) {d.id = (d.parent ? d.parent.id + "." : "") + d.data.shortName; }) //with out problems
      // @ts-ignore
      .sum((d) => d.size)
      .sort(function(a, b) {
        return b.height - a.height || b.value - a.value;
      });

    // @ts-ignore
    root.x = root.y = 0;
    // @ts-ignore
    root.dx = width;
    // @ts-ignore
    root.dy = height;
    // @ts-ignore
    root.depth = 0;

    if(this.data.length > 0) {
      accumulate(root);
      layout(root);
      treemap(root);
      display(root);
    }

    function accumulate(d) {
      return (d._children = d.children)
        ? d.value = d.children.reduce(function(p, v) { return p + accumulate(v); }, 0) : d.value;
    }

    function layout(d) {
      if (d._children) {
        d._children.forEach(function(c) {
          c.x0 = d.x0 + c.x0 * d.x1;
          c.y0 = d.y0 + c.y0 * d.y1;
          c.x1 *= (d.x1 - d.x0);
          c.y1 *= (d.y1 - d.y0);
          c.parent = d;
          layout(c);
        });
      }
    }

    function display(d) {
      grandparent
        .datum(d.parent)
        .on("click", transition)
         .on("mouseover", function(d){
            if (self.selectedElts.length > 0) return getTooltip(d, true);
         })
         .on("mouseout", function(){
            if (self.selectedElts.length > 0) closeTooltip();
         })
        .select("text")
        .text(name(d));

      var g1 = svg.insert("g", ".grandparent")
        .datum(d)
        .attr("class", "depth");

      var g = g1.selectAll("g")
        .data(d._children)
        .enter().append("g");
      // @ts-ignore
      g.filter(function(d) { return d._children; })
        .classed("children", true)
        .on("click", transition);
      // @ts-ignore
      var children = g.selectAll(".child").data(function(d) { return d._children || [d]; })
        .enter().append("g");
      children.append("rect")
        .attr("class", "child")
        .call(rect)
        .append("title")
        // @ts-ignore
        .text(function(d) { return d.data.shortName + " (" + formatNumber(d.value) + ")"; });

      children.append("text")
        .attr("class", "ctext")
        // @ts-ignore
        .text(function(d) { return d.data.shortName; })
        .call(text2);
      g.append("rect")
      // @ts-ignore
        .attr("id", function(d) { return d.id.replace(/[\.\s]+/g,''); })
        .attr("class", "parent")
        .call(rect)
        .on("mouseover", function(d) {
           return getTooltip(d); })
        .on('mouseout', function () {
          closeTooltip();
        })
        .on('click', transition);

      var t = g.append("text")
        .attr("class", "ptext")
        .attr("dy", "0.7em");

      // @ts-ignore
      t.append("tspan").text(function(d) { return d.data.shortName; });

      t.append("tspan")
        .attr("dy", "0.9em")
        // @ts-ignore
        .text(function(d) { return formatNumber(d.value); });

      t.call(text);
    // @ts-ignore
      g.selectAll("rect").style("fill", function(d) {
         // @ts-ignore
         if(!(typeof d.data.arrOriginal === 'undefined') && d.data.arrOriginal.length==1){
            // @ts-ignore
            let found = self.selectedElts.find(elSel => elSel === d.data.arrOriginal[0][0]) !== undefined;
            if (found) graphPatternFill(d, svg);
         }
         // @ts-ignore
         return color(d.data.shortName);
      });

      function transition(d){
        if (transitioning || !d) return;
        let currentElement = this;
        let closestChild = currentElement.closest('g').getElementsByClassName('child')[0];
        if(currentElement.parentElement.classList.contains("children") || currentElement.classList.contains('grandparent')){
          transitioning = true;
          var g2 = display(d),
            t1 = g1.transition().duration(750),
            t2 = g2.transition().duration(750);

          // Update the domain only after entering new elements.
          x.domain([d.x0, d.x0 + (d.x1 - d.x0)]);
          y.domain([d.y0, d.y0 + (d.y1 - d.y0)]);

          // Enable anti-aliasing during the transition.
          svg.style("shape-rendering", null);

          // Draw child nodes on top of parent nodes.
          svg.selectAll(".depth").sort(function(a, b) {
            // @ts-ignore
            return a.depth - b.depth; });

          // Fade-in entering text.
          g2.selectAll("text").style("fill-opacity", 0);

          // Transition to the new view.
          t1.selectAll(".ptext").call(text).style("fill-opacity", 0);
          t2.selectAll(".ptext").call(text).style("fill-opacity", 1);
          t1.selectAll(".ctext").call(text2).style("fill-opacity", 0);
          t2.selectAll(".ctext").call(text2).style("fill-opacity", 1);
          t1.selectAll("rect").call(rect);
          t2.selectAll("rect").call(rect);

          // Remove the old node when the transition is finished.
          t1.remove().on("end", function() {
            svg.style("shape-rendering", "crispEdges");
            transitioning = false;
          });
        }
        else{
          // @ts-ignore
          d.data.arrOriginal.forEach(function(el) {
            let found = self.selectedElts.find(elSel => elSel === el[0]) !== undefined;
            if (found) {
              self.selectedElts = self.selectedElts.filter(elSel => elSel !== el[0]);
               self.selectedEltsNames = self.selectedEltsNames.filter(elSel => elSel !== d.data.shortName);
               self.selectedEltsIds = self.selectedEltsIds.filter(elSel => elSel !== d.id);
               svg.select('#customize-pattern-'+d.id.replace(/[\.\s]+/g,'')).remove();
            }
            else {
              self.selectedElts.push(el[0]);
              self.selectedEltsNames.push(d.data.shortName);
              self.selectedEltsIds.push(d.id);
              self.selectedEltsNames.sort();
              graphPatternFill(d, svg);
            }
            if(self.selectedElts.length>0)  grandparentTitle.style("fill", "#4CAF50");
            else  grandparentTitle.style("fill", "orange");
          });
          self.broadcast();
        }
      }
      return g;
    }

    function graphPatternFill(d, svg){
          // @ts-ignore
          let currentTemp = d3.select('#'+d.id.replace(/[\.\s]+/g,''));
          // @ts-ignore
          let gElement = currentTemp.select(function() { return this.parentNode; });
          if(!d3.select('#customize-pattern-'+d.id.replace(/[\.\s]+/g,'')).empty()) return;
          if(currentTemp.node()==null) return;
          // @ts-ignore
          gElement.append("rect")
             // @ts-ignore
             .attr("x", currentTemp.node().getAttribute("x")).attr("y", currentTemp.node().getAttribute("y"))
             // @ts-ignore
             .attr("width", currentTemp.node().getAttribute("width")).attr("height", currentTemp.node().getAttribute("height"))
             // @ts-ignore
             .attr('id', 'customize-pattern-'+d.id.replace(/[\.\s]+/g,''))
             .attr('fill', 'url(#diagonalHatch)')
             .on('mouseover', function(d){
                return getTooltip(d);
             })
             .on('mouseout', function(){
                closeTooltip();
             })
             .on('click', function(){
                svg.select('#'+d.id.replace(/[\.\s]+/g,'')).dispatch('click');
             });
    }

    function text(text) {
      text.selectAll("tspan")
        .attr("x", function(d) { return x(d.x0) + 6; });
      text.attr("x", function(d) { return x(d.x0) + 6; })
        .attr("y", function(d) { return y(d.y0) + 3; })
        .style("opacity", function(d) {
          var w = x(d.x1) - x(d.x0);
          return this.getComputedTextLength() < w - 6 ? 1 : 0; });
    }

    function text2(text) {
      text.attr("x", function(d) {
        return x(d.x1) - this.getComputedTextLength() - 6;
      })
        .attr("y", function(d) { return y(d.y1) - 6; })
        .style("opacity", function(d) {
          var w = x(d.x1) - x(d.x0);
          return this.getComputedTextLength() < w - 6 ? 1 : 0;
        });
    }

    function getTitleTooltip(d){
      return d.data.name.split(' ')[1] + ': <span>' + d.data.shortName + '<br>' + d.data.longName + '</span><br> value: <span>' + d3.format(",")(d.value) + '</span>';
    }

     function getGrandparentTooltip(){
       let ciapCodes = '';
       self.selectedEltsNames.forEach(function(el, index){
          //if(index!= 0 && index%3==0) ciapCodes += '<br>';
          ciapCodes += el + ': <span>' + self.labelsDict[el][1] + '</span><br>'
        });

       return ciapCodes.substring(0,ciapCodes.length-2);
     }

    function getTooltip(d, isGrandparent=false){
        if(isGrandparent) tooltip.html(getGrandparentTooltip());
        else tooltip.html(getTitleTooltip(d));
        tooltip.transition().duration(200).style('opacity', 0.95);
        return tooltip.style("visibility", "visible")
           .style("opacity", 1)
           .style('left', `${d3.event.layerX - 20}px`)
           .style('top', `${d3.event.layerY-30}px` )
     }

    function closeTooltip(){
       tooltip.transition().duration(500).style('opacity', 0);
    }

    function rect(rect){
      rect.attr("x", function(d) { return x(d.x0); })
        .attr("y", function(d) { return y(d.y0); })
        .attr("width", function(d) {
          var w = x(d.x1) - x(d.x0);
          return w;
        })
        .attr("height", function(d) {
          var h = y(d.y1) - y(d.y0);
          return h;
        });
    }

    function name(d) {
      return d.parent ? name(d.parent) + " / " + d.data.shortName + " (" + formatNumber(d.value) + ")" : d.data.shortName + " (" + formatNumber(d.value) + ")";
    }

     if(self.selectedElts.length>0){
        grandparentTitle.style("fill", "#4CAF50");
     }
  }

  ngAfterViewInit() {
    window.addEventListener('resize', this.loadWidget);
    this.loadWidget();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.loadWidget);
  }
}
