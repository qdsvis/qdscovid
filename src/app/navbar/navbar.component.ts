import { Component, OnInit } from '@angular/core';
import { SchemaService } from '../services/schema.service';

@Component({
   selector: 'app-navbar',
   templateUrl: './navbar.component.html',
   styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
   show = false;
   datasets = [];

   constructor(
      private schemaService: SchemaService,
   ) {}

   ngOnInit() {
      this.show = false;
      for (const [key, value] of Object.entries(this.schemaService.datasets)) {
         this.datasets.push({name: value.datasetName, label: value.datasetLabel});
      }
   }

   toggleCollapse() {
      this.show = !this.show;
   }
}
