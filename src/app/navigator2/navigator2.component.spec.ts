import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Navigator2Component } from './navigator2.component';

describe('Navigator2Component', () => {
   let component: Navigator2Component;
   let fixture: ComponentFixture<Navigator2Component>;

   beforeEach(async(() => {
      TestBed.configureTestingModule({
         declarations: [ Navigator2Component ]
      })
         .compileComponents();
   }));

   beforeEach(() => {
      fixture = TestBed.createComponent(Navigator2Component);
      component = fixture.componentInstance;
      fixture.detectChanges();
   });

   it('should create', () => {
      expect(component).toBeTruthy();
   });
});
