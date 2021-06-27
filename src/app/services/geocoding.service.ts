import { Http } from '@angular/http';
import { Injectable } from '@angular/core';

import { Location } from '../location';

import * as L from 'leaflet';

import 'rxjs/add/operator/map';

@Injectable()
export class GeocodingService {

   constructor(private http: Http) { }

   geocode(address: string) {
      return this.http
      .get('https://api.opencagedata.com/geocode/v1/json?q=' + encodeURIComponent(address) +
         '&key=' + '6a69f100d01340c58bfa2365ded5f6ed' +
         '&limit=1')
         .map(response => response.json())
         .map(response => {
            if (response.status.message !== 'OK') {
               throw new Error('unable to geocode address');
            }

            const location = new Location();
            location.address = response.results[0].formatted;
            location.latitude = response.results[0].geometry.lat;
            location.longitude = response.results[0].geometry.lng;

            const viewPort = response.results[0].bounds;
            location.viewBounds = L.latLngBounds(
               {
                  lat: viewPort.southwest.lat,
                  lng: viewPort.southwest.lng
               },
               {
                  lat: viewPort.northeast.lat,
                  lng: viewPort.northeast.lng
               });

            return location;
         });
   }
}
