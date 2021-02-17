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
         'datasetLabel': 'Data por registro',
         'timeStep': 86400,

         'identifier': 'track_id',
         'trajectory': 'direction_t',

         'qtd_graphics_small': 4,
         'qtd_graphics_large': 2,
         'graphics_small': ['sexo',
            'profissionalSaude',
            'tipoTeste',
            'estadoTeste',
            'resultadoTeste',
            'evolucaoCaso',
            'classificacaoFinal'],
         'graphics_large': [],


         'temporalDimension': {/*'date': { 'lower': 0, 'upper': 0 }*/},
         'spatialDimension': ['coord'],
         // 'barCategoricalDimension': ['tipo_origem', 'idade', 'sexo'],
         'barCategoricalDimension': ['sexo',
            'profissionalSaude',
            'tipoTeste',
            'estadoTeste',
            'resultadoTeste',
            'evolucaoCaso',
            'classificacaoFinal'],
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
            // sexo
            'sexo_label': "Sexo",
            'sexo_desc': ['Feminino', 'Indefinido', 'Masculino', 'NA'],
            'sexo': ['Fem.', 'Ind.', 'Mas.', 'NA'],
            // profissionalSaude
            'profissionalSaude_label': "Profissional de Saúde",
            'profissionalSaude': ['Não', 'Sim', 'NA'],
            // tipoTeste
            'tipoTeste_label': "Tipo de teste",
            'tipoTeste_desc': ['Enzimaimunoensaio',
               'Enzimaimunoensaio',
               'Imunoensaio por Eletroquimioluminescencia',
               'Imunoensaio por Eletroquimioluminescencia',
               'Quimioluminescencia', 'RT-PCR', 'Teste rápido',
               'Teste rápido - anticorpo', 'Teste rápido - antígeno', 'NA'],
            'tipoTeste': ['ELISA', 'ELISA-IgM', 'ECLIA', 'ECLIA-IgG', 'CLIA',
               'T. ráp.', 'Anticorpo', 'Antígeno', 'NA'],
            // estadoTeste
            'estadoTeste_label': "Estado do teste",
            'estadoTeste_desc': ["Coletado", "Concluido",
               "Exame não solicitado", "Solicitado", "NA"],
            'estadoTeste': ["Col.", "Concl.", "Não sol.", "Sol.", "NA"],
            // resultadoTeste
            'resultadoTeste_label': "Resultado do Teste",
            'resultadoTeste_desc': ['Inconclusivo ou Indeterminado', 'Negativo', 'Positivo', 'NA'],
            'resultadoTeste': ['Incon./Ind.', 'Neg.', 'Pos.', 'NA'],
            // evolucaoCaso
            'evolucaoCaso_label': "Evolução do caso",
            'evolucaoCaso_desc': ["Cancelado", "Cura", "Em tratamento domiciliar",
               "Ignorado", "Internado", "Internado em UTI", "Óbito", "NA"],
            "evolucaoCaso": ["Canc.", "Cura", "Dom.", "Igno.", "Inter.", "UTI", "Óbito", "NA"],
            // classificacaoFinal
            "classificacaoFinal_label": "Classificação Final",
            "classificacaoFinal_desc": ["Confirmação clínico - Epidemoiológico",
               "Confirmação laboratorial", "Confirmado clínico - Epidemoiológico",
               "Confirmado clínico - Imagem", "Confirmado laboratorial",
               "Confirmado por criterio clínico", "Descartado",
               "Síndrome gripal não especificada", "NA"],
            "classificacaoFinal": ["Epidem.",
               "Lab.", "Epidem.",
               "Imag.", "Lab.",
               "Crit. clí.", "Desc.",
               "Grip. não esp.", "NA"],
         },
         'treemapAliases': {
         }
      },
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
