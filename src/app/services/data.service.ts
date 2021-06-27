import { ConfigurationService } from './configuration.service';

import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import { forkJoin } from 'rxjs';

@Injectable()
export class DataService {
   private actionUrl: string;
   private headers = new Headers();

   constructor(private http: Http, private config: ConfigurationService) {
      this.headers.append('Content-Type', 'application/json');
      this.headers.append('Accept', 'application/json');
   }

   private handleError(error: any): Observable<any> {
      console.error('An error occurred', error);
      return Observable.throw(error.json().error || 'Server error');
   }


   query(action: string, complete=false): Observable<any> {
      return this.http
            .get(complete ? action : (this.config.ServerWithApiUrl + action))
            .map(response => response.json());
   }

   queryMultiple(indexs: Number[], actions: string[], complete = false) {
      var responses = new Array()

      for (var i = 0; i < indexs.length; i++) {
         let index = indexs[i]
         let action = actions[i]

         let value = this.http
            .get(complete ? action : (this.config.ServerWithApiUrl + action))
            .map(response => {
               let result = response.json()
               result.index = index
               return result
            });

         responses.push(value)
      }

      return forkJoin(responses)
   }


   schema(action: string): Observable<any> {
      return this.http
      .get(this.config.ServerWithApiUrl + '/schema' + action)
      .map(response => response.json());
   }
}
