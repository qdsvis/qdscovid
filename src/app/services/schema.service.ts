import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';

import * as moment from 'moment';
import { DataService } from './data.service';
import { ConfigurationService } from './configuration.service';

@Injectable()
export class SchemaService {
   global = {
      'worldRegion': 'world',
      'worldLabel': 'Brasil',
      'regionCategoricalDimension': ['cod_uf', 'cod_ibge'],
      'equipe': {'key1': 'cod_ibge', 'key2': 'equipe', 'name':'equipe', 'nameCSV':'mapMunEquipe.csv'}
   };
   datasets = {
		'qdscovid': {
         'local': 'Brazil',
         'geometry': 'rect',
         'geometry_size': 0,
         'resolution': 5,
         'composition': 'lighter',
         'color': 'ryw',

         'datasetName': 'qdscovid',
         'datasetLabel': 'QDSCOVID',
         'timeStep': 86400,

         'identifier': 'track_id',
         'trajectory': 'direction_t',

         'qtd_graphics_small': 4,
         'qtd_graphics_large': 2,
         'graphics_small': ['sexo', 'profissionalSaude', 'resultadoTeste'],
         'graphics_large': [],


         'temporalDimension': {/*'date': { 'lower': 0, 'upper': 0 }*/},
         'spatialDimension': ['coord'],
         // 'barCategoricalDimension': ['tipo_origem', 'idade', 'sexo'],
         'barCategoricalDimension': ['sexo', 'profissionalSaude', 'resultadoTeste'],
	 'treemapCategoricalDimension': [/*'ciap'*/],
         'payloads': ['weight', 'height'],
         'payloadValues': {
            'weight': {
               'quantile': { 'min_value': 0, 'max_value': 150, 'value': 0.5, 'min': 0, 'max': 1, 'step': 0.05 },
               'cdf': { 'min_value': 0, 'max_value': 1, 'value': 75, 'min': 0, 'max': 150, 'step': 0.05 },
               'mean': { 'min_value': 0, 'max_value': 150 },
               'variance': { 'min_value': 0, 'max_value': 1500 },
               'pipeline': { 'min_value': 0, 'max_value': 1 } 
            },
            'height': {
               'quantile': { 'min_value': 0, 'max_value': 250, 'value': 0.5, 'min': 0, 'max': 1, 'step': 0.05 },
               'cdf': { 'min_value': 0, 'max_value': 1, 'value': 125, 'min': 0, 'max': 250, 'step': 0.05 },
               'mean': { 'min_value': 0, 'max_value': 250 },
               'variance': { 'min_value': 0, 'max_value': 2500 },
               'pipeline': { 'min_value': 0, 'max_value': 1 } 
            }
         },
         'aliases': {
            'sexo_label': "Sexo",
            'sexo_desc': ['Feminino', 'Indefinido', 'Masculino', 'NA'],
	    'sexo': ['Femi.', 'Ind.', 'Mascu.', 'NA'],
	    'profissionalSaude_label': "Profissional de Saúde",
	    'profissionalSaude': ['Não', 'Sim', 'NA'],
	    'resultadoTeste_label': "Resultado do Teste",
	    'resultadoTeste': ['Incon./Ind.', 'Neg.', 'Pos.', 'NA'],
			},
         'treemapAliases': {
            }
         },
      /*'spotifyvis': {
         'local': 'Sudamerica',
         'geometry': 'rect',
         'geometry_size': 0,
         'resolution': 5,
         'composition': 'lighter',
         'color': 'ryw',

         'datasetName': 'spotifyvis',
         'datasetLabel': 'Spotify Vis',
         'timeStep': 86400,

         'identifier': 'track_id',
         'trajectory': 'direction_t',

         'qtd_graphics_small': 4,
         'qtd_graphics_large': 2,
         'graphics_small': ['streams', 'time_signature', 'key'],
         'graphics_large': ['date'],

         'temporalDimension': {
            'date': { 'lower': 0, 'upper': 0 }
         },
         'spatialDimension': ['country_coord'],
         'barCategoricalDimension': ['streams', 'time_signature', 'key'],
         'treemapCategoricalDimension': [],
         'payloads': ['danceability', 'energy', 'speechiness', 'acousticness', 'instrumentalness', 'liveness', 'valence', 'duration_ms', 'tempo'],
         'payloadValues': {
            'danceability': {
               'quantile': { 'min_value': 0, 'max_value': 1, 'value': 0.5, 'min': 0, 'max': 1, 'step': 0.005 },
               'cdf': { 'min_value': 0, 'max_value': 1, 'value': 0.5, 'min': 0, 'max': 1, 'step': 0.005 },
               'mean': { 'min_value': 0, 'max_value': 1 },
               'variance': { 'min_value': 0, 'max_value': 1 },
               'pipeline': { 'min_value': 0, 'max_value': 1 }
            },
            'energy': {
               'quantile': { 'min_value': 0, 'max_value': 1, 'value': 0.5, 'min': 0, 'max': 1, 'step': 0.005 },
               'cdf': { 'min_value': 0, 'max_value': 1, 'value': 0.5, 'min': 0, 'max': 1, 'step': 0.005 },
               'mean': { 'min_value': 0, 'max_value': 1 },
               'variance': { 'min_value': 0, 'max_value': 1 },
               'pipeline': { 'min_value': 0, 'max_value': 1 }
            },
            'speechiness': {
               'quantile': { 'min_value': 0, 'max_value': 1, 'value': 0.5, 'min': 0, 'max': 1, 'step': 0.005 },
               'cdf': { 'min_value': 0, 'max_value': 1, 'value': 0.5, 'min': 0, 'max': 1, 'step': 0.005 },
               'mean': { 'min_value': 0, 'max_value': 1 },
               'variance': { 'min_value': 0, 'max_value': 1 },
               'pipeline': { 'min_value': 0, 'max_value': 1 }
            },
            'acousticness': {
               'quantile': { 'min_value': 0, 'max_value': 1, 'value': 0.5, 'min': 0, 'max': 1, 'step': 0.005 },
               'cdf': { 'min_value': 0, 'max_value': 1, 'value': 0.5, 'min': 0, 'max': 1, 'step': 0.005 },
               'mean': { 'min_value': 0, 'max_value': 1 },
               'variance': { 'min_value': 0, 'max_value': 1 },
               'pipeline': { 'min_value': 0, 'max_value': 1 }
            },
            'instrumentalness': {
               'quantile': { 'min_value': 0, 'max_value': 1, 'value': 0.5, 'min': 0, 'max': 1, 'step': 0.005 },
               'cdf': { 'min_value': 0, 'max_value': 1, 'value': 0.5, 'min': 0, 'max': 1, 'step': 0.005 },
               'mean': { 'min_value': 0, 'max_value': 1 },
               'variance': { 'min_value': 0, 'max_value': 1 },
               'pipeline': { 'min_value': 0, 'max_value': 1 }
            },
            'liveness': {
               'quantile': { 'min_value': 0, 'max_value': 1, 'value': 0.5, 'min': 0, 'max': 1, 'step': 0.005 },
               'cdf': { 'min_value': 0, 'max_value': 1, 'value': 0.5, 'min': 0, 'max': 1, 'step': 0.005 },
               'mean': { 'min_value': 0, 'max_value': 1 },
               'variance': { 'min_value': 0, 'max_value': 1 },
               'pipeline': { 'min_value': 0, 'max_value': 1 }
            },
            'valence': {
               'quantile': { 'min_value': 0, 'max_value': 1, 'value': 0.5, 'min': 0, 'max': 1, 'step': 0.005 },
               'cdf': { 'min_value': 0, 'max_value': 1, 'value': 0.5, 'min': 0, 'max': 1, 'step': 0.005 },
               'mean': { 'min_value': 0, 'max_value': 1 },
               'variance': { 'min_value': 0, 'max_value': 1 },
               'pipeline': { 'min_value': 0, 'max_value': 1 }
            },
            'duration_ms': {
               'quantile': { 'min_value': 31413, 'max_value': 10435467, 'value': 0.5, 'min': 0, 'max': 1, 'step': 0.005 },
               'cdf': { 'min_value': 0, 'max_value': 1, 'value': 5231413, 'min': 31413, 'max': 10435467, 'step': 1 },
               'mean': { 'min_value': 31413, 'max_value': 10435467 },
               'variance': { 'min_value': 314130, 'max_value': 104354670 },
               'pipeline': { 'min_value': 0, 'max_value': 1 }
            },
            'tempo': {
               'quantile': { 'min_value': 34, 'max_value': 233, 'value': 0.5, 'min': 0, 'max': 1, 'step': 0.005 },
               'cdf': { 'min_value': 0, 'max_value': 1, 'value': 134, 'min': 34, 'max': 233, 'step': 0.005 },
               'mean': { 'min_value': 34, 'max_value': 233 },
               'variance': { 'min_value': 340, 'max_value': 2330 },
               'pipeline': { 'min_value': 0, 'max_value': 1 }
            }
         },
         'aliases': {
            'country': ['ARG', 'AUS', 'AUT', 'BEL', 'BOL', 'BRA', 'CAN', 'CHE', 'CHL', 'COL', 'CRI', 'CZE', 'DEU', 'DNK', 'DOM', 'ECU', 'ESP', 'EST', 'FIN', 'FRA', 'GBR', 'GRC', 'GTM', 'HKG', 'HND', 'HUN', 'IDN', 'IRL', 'ISL', 'ISR', 'ITA', 'JPN', 'LTU', 'LVA', 'MEX', 'MYS', 'NIC', 'NLD', 'NOR', 'NZL', 'PAN', 'PER', 'PHL', 'POL', 'PRT', 'PRY', 'ROU', 'SGP', 'SLV', 'SVK', 'SWE', 'THA', 'TUR', 'TWN', 'URY', 'USA', 'VNM'],
            'streams': ["679-3.46K", "3.46K-17.68K", "17.68K-90.24K", "90.24K-460.62K", "460.62K-2.35M", "2.35M-12M"],
            'time_signature': ["1", "2", "3", "4", "5"],
            'key': ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"]
         },
         'treemapAliases': {
         }
      },*/
   };

   constructor(
      private config: ConfigurationService,
      private dataService: DataService,
   ) { }

   get(dataset?: string): any {
      let obj: any;
      if (dataset !== undefined) {
         obj = this.datasets[dataset];
      } else {
         obj = this.datasets[this.config.defaultDataset];
      }
      return obj;
   }

   getGlobal() {
      return this.global;
   }

   getPromise(key: string) {
      return new Promise((resolve, reject) => {
         const dataset = this.datasets[key];
         this.dataService.schema('/dataset=' + dataset.datasetName).subscribe(data => {
            if ((<any[]>data).length === 0) {
               resolve(true);
               return;
            }
            for (const dim of data.index_dimensions) {
               if (dim.type === 'temporal') {
                  const interval = (<string>dim.hint).split('|');
                  dataset.temporalDimension[dim.index].lower = interval[0];
                  dataset.temporalDimension[dim.index].upper = interval[1];
               }
            }
            resolve(true);
         });
      });
   }

   load() {
      const promises = [];
      for (const key of Object.keys(this.datasets)) {
         promises.push(this.getPromise(key));
      }

      return new Promise((resolve, reject) => {
         Promise.all(promises).then(() => resolve(true));
      });
   }
}
