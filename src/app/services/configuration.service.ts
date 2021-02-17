import { Injectable } from '@angular/core';

@Injectable()
export class ConfigurationService {
   // public Server = 'http://combaftp.inf.ufrgs.br:10091/';
   // public Server = 'http://143.54.13.50:7000/';
   // public Server = 'http://143.54.13.201:7000/';
   public Server = 'http://34.204.217.23:7000/';
   public ApiUrl = 'api';
   public ServerWithApiUrl = this.Server + this.ApiUrl;

   public defaultDataset = 'qdscovid';

   constructor() { }

}
