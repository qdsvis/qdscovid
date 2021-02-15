import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { DataService } from './data.service';
import { SchemaService } from './schema.service';

@Injectable()
export class GeoDataService {
   private dataset;

   public json = new Map();
   public json_curr = new Map();
   public json_value = new Map();
   public json_min_max = new Map();
   public json_min_max_pop = new Map();
   public json_min_max_den = new Map();
   public json_selected = new Map();

   private headers = new HttpHeaders({
      // 'Cache-control': 'public'
   });

   constructor(
      private httpService: HttpClient,
      private dataService: DataService,
      private schemaService: SchemaService
   ) { }

   load() {
      // initialize maps
      for (const dim of this.schemaService.getGlobal()['regionCategoricalDimension']) {
         this.json_selected.set(dim, new Map());
         this.json_min_max.set(dim, [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]);
         this.json_min_max_pop.set(dim, [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]);
         this.json_min_max_den.set(dim, [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]);
      }

      let getRegionPromise = (dim, file) => {
         return new Promise((resolve, reject) => {
            this.httpService.get(file, { headers: this.headers })
               .subscribe(response => {
                  this.json.set(dim, response);
                  resolve(true);
               }, (err: HttpErrorResponse) => {
                  console.log(err.message);
               });
         })
      };

      let promises = [];

      promises.push(getRegionPromise(this.schemaService.getGlobal()['worldRegion'], './assets/geojson/'+ this.schemaService.getGlobal()['worldRegion'] + '.geojson'));
      for (const dim of this.schemaService.getGlobal()['regionCategoricalDimension']) {
         promises.push(getRegionPromise(dim, './assets/geojson/'+ dim + '.geojson'));
      }

      return new Promise((resolve, reject) => {
         Promise.all(promises).then(() => resolve(true));
      });
   }
}
