import {Component, Inject, Input, TemplateRef} from '@angular/core';
import {NB_DIALOG_CONFIG, NbDialogService} from '@nebular/theme';
import { NbDialogRef } from '@nebular/theme';
import {DataService} from "../../../services/data.service";
import {SchemaService} from "../../../services/schema.service";
import {LocalDataSource} from "ng2-smart-table";
import * as d3 from 'd3';

export interface EquipeElement {
   cod_qds: number;
   equipe: string;
   atend: number;
}

export interface MunElement {
   cod_qds: number;
   cod_ibge: string;
   name: string;
   atend: number;
   pop: number;
   den: number;
}

export interface DialogData {
   datasetName: string;
   dim: string,
   consts: string,
   ibge2Equipe: any,
   data: any;
}

@Component({
  selector: 'ngx-dialog',
  templateUrl: 'dialog-equipes.component.html',
  styleUrls: ['dialog-equipes.component.scss'],
})



export class DialogEquipesComponent {

   title: string;
   data: DialogData;

   dim = this.schemaService.getGlobal()["equipe"]["name"];
   highlightedRows = new Map();
   equipesXMunicipio = new Map();
   nameMunicipio = new Map();

   settings = {
      actions: false,
      hideSubHeader: true,
      selectMode: 'multi',
      columns: {
         name: {
            title: 'Nome',
            type: 'string',
            filter: false,
         },
         atend: {
            title: 'Atendimentos',
            type: 'html',
            filter: false,
            // valuePrepareFunction: (value) => { return this.formatThousandsSeperator(value);},
            valuePrepareFunction: (value) => { return "<div class='text-right'>" + this.formatThousandsSeperator(value) + "</div>";},
         },
         pop: {
            title: 'População',
            type: 'html',
            filter: false,
            valuePrepareFunction: (value) => { return "<div class='text-right'>" + this.formatThousandsSeperator(value) + "</div>";},
         },
         den: {
            title: 'Densidade/1M',
            type: 'html',
            filter: false,
            sortDirection: 'desc',
            valuePrepareFunction: (value) => { return "<div class='text-right'>" + this.formatDecimal(value) + "</div>";},
         }
      },
   };

   settingsDet = {
      actions: false,
      hideSubHeader: true,
      columns: {
         equipe: {
            title: 'Equipe',
            type: 'string',
            filter: false,
         },
         atend: {
            title: 'Atendimentos',
            type: 'number',
            filter: false,
            sortDirection: 'desc',
            valuePrepareFunction: (value) => { return this.formatThousandsSeperator(value);},
         }
      },
   };


   source: LocalDataSource = new LocalDataSource();



   constructor(
      public dialogRef: NbDialogRef<DialogEquipesComponent>,
      private dataService: DataService,
      private schemaService: SchemaService) {
   }

   ngAfterViewInit() {
      this.source.load(this.data.data);
      let dialog = document.getElementById('dialogTable');
      let container = dialog.closest(".cdk-overlay-pane");
      container.classList.add('cdk-overlay-pane-giant');
   }

   onClose(): void {
      this.dialogRef.close();
   }

   exportDataToCsv(source, settings, name) {
      exportToCsv(source, settings, name);
   }

   selectRows(row) {
      if(row.data==null){  //select all or unselected all
         if(row.selected.length>0){
            for(let i=0; i<row.selected.length; i++){
               if (!this.highlightedRows.has(row.selected[i]) || this.highlightedRows.get(row.selected[i])==false) {
                  this.highlightedRows.set(row.selected[i], true);
                  this.addEquipe(row.selected[i]);
               }
            }
         }
         else{
            this.highlightedRows.forEach((value, key) => {
               this.highlightedRows.set(key, false);
               this.removeEquipe(key);
            });
         }
      }
      else{ //select one
          if (this.highlightedRows.has(row.data)) {
             if (!row.isSelected) {
                this.highlightedRows.set(row.data, false);
                this.removeEquipe(row.data);
             }
             else {
                this.highlightedRows.set(row.data, true);
                this.addEquipe(row.data);
             }
          }
          else {
             this.highlightedRows.set(row.data, true);
             this.addEquipe(row.data);
         }
      }
   }

   addEquipe(key) {
      if (!this.nameMunicipio.has(key['cod_qds'])) {
         this.nameMunicipio.set(key['cod_qds'], key['name']);
      }
      let query = '/query/dataset=' + this.data.datasetName + '/aggr=count' + this.data.consts +
         '/const=' + this.data.dim + '.values.(' + key['cod_qds'] + ')' +
         '/const=' + this.dim + '.values.(all)'+ '/group=' + this.dim;

      this.dataService.query(query).subscribe(data => {
         data[0].sort(function (a, b) {
            return b[1] - a[1];
         });
         const equipes: EquipeElement[] = [];

         for (let i = 0; i < data[0].length; i++) {
            const row_equipe = this.data.ibge2Equipe.get(key['cod_ibge']).get(String(data[0][i][0] + 1));
            if (row_equipe != undefined) {
               equipes.push({cod_qds: data[0][i][0], equipe: row_equipe['cod_equipe'], atend: data[0][i][1]});
            }
            else {
               equipes.push({cod_qds: data[0][i][0], equipe: '-', atend: data[0][i][1]});
            }
         }
         let sourceTemp = new LocalDataSource();
         sourceTemp.load(equipes);
         this.equipesXMunicipio.set(key['cod_qds'], sourceTemp);
      });
   }

   removeEquipe(key) {
      this.equipesXMunicipio.delete(key['cod_qds']);
   }

   formatThousandsSeperator(n) {
      return d3.format(",")(n);
   }

   formatDecimal(n) {
      return d3.format("0.2f")(n);
   }

   getKeys(map) {
      return Array.from(map.keys());
   }
}


export class TableColumn {
   field: string;
   title: string;
   isExport: boolean;
   valuePrepareFunction: Function;
}

export const prepareColumnMap = (settingColumns: any): Map<string, TableColumn> => {
   const columnMap: Map<string, TableColumn> = new Map<string, TableColumn>();
   for (const key in settingColumns) {
      if (!settingColumns.hasOwnProperty(key)) {
         continue;
      }
      const column: TableColumn = new TableColumn();
      column.title = settingColumns[key]['title'];
      column.field = key;
      column.isExport = settingColumns[key]['isExport'];
      column.valuePrepareFunction = settingColumns[key]['valuePrepareFunction'];
      columnMap.set(column.field, column);
   }
   return columnMap;
}

export const exportToCsv = (source: any, settingColumns: any, tableName: string) => {
   const columnMap = prepareColumnMap(settingColumns.columns);
   const columns: TableColumn[] = Array.from(columnMap.values());

   let encodedStr = columns.reduce((acct, current: TableColumn) => {
      if (current.isExport !== false) {
         return acct += '"' + current.title + '",';
      } else {
         return acct;
      }
   }, '');

   encodedStr = encodedStr.slice(0, -1);
   encodedStr += '\r\n';

   const fields: string[] = columns.reduce((acct, column: TableColumn) => {
      if (column.isExport !== false) {
         acct.push(column.field);
      }
      return acct;
   }, []);

   source.getAll().then((rows: any) => {
      rows.forEach((row: any) => {
         fields.forEach((field) => {
            if (row.hasOwnProperty(field)) {
               let value = row[field];

               if (!value) {
                  value = ' ';
               }
               const valuePrepare = columnMap.get(field).valuePrepareFunction;
               if (valuePrepare) {
                  value = valuePrepare.call(null, value, row);
               }
               value = value.replace(/<\/?[^>]+(>|$)/g, "");
               encodedStr += '"' + value + '",';
            }
         });
         encodedStr = encodedStr.slice(0, -1);
         encodedStr += '\r\n';
      });

      const a = document.createElement('a');
      a.setAttribute('style', 'display:none;');
      document.body.appendChild(a);
      // Set utf-8 header to let excel recognize its encoding
      const blob = new Blob(['\ufeff', encodedStr], { type: 'text/csv;charset=utf-8;' });
      a.href = window.URL.createObjectURL(blob);
      a.download = (tableName) + '.csv';
      a.click();
   });
}
