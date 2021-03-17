import { Injectable } from '@angular/core';

@Injectable()
export class ConfigurationService {
   public Server = 'http://saude.inf.ufrgs.br:7000/'
   public ApiUrl = 'api';
   public ServerWithApiUrl = this.Server + this.ApiUrl;

   public defaultDataset = 'qdscovid_registers';

   constructor() { }

}
