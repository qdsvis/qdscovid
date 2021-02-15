import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TreemapChartComponent } from './treemap-chart.component';

describe('TreemapChartComponent', () => {
   let component: TreemapChartComponent;
   let fixture: ComponentFixture<TreemapChartComponent>;

   beforeEach(async(() => {
      TestBed.configureTestingModule({
         declarations: [ TreemapChartComponent ]
      })
         .compileComponents();
   }));

   beforeEach(() => {
      fixture = TestBed.createComponent(TreemapChartComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
   });

   it('should create', () => {
      expect(component).toBeTruthy();
   });
});
