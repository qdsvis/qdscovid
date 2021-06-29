import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class SharedService {

   /*shared functions */
   private eventSubject = new BehaviorSubject<any>(undefined);

   // call event shared
   triggerEvent(param: any) {
      this.eventSubject.next(param);
   }

   //eturn  shared subject
   getEventSubject(): BehaviorSubject<any> {
      return this.eventSubject;
   }
}
