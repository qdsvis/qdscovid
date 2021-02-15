import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbMediaBreakpointsService, NbMenuService, NbSidebarService, NbThemeService } from '@nebular/theme';
import { NbAuthJWTToken, NbAuthService, NbTokenService } from '@nebular/auth';

import { UserData } from '../../../@core/data/users';
import { LayoutService } from '../../../@core/utils';
import { map, takeUntil, filter } from 'rxjs/operators';
import { Subject } from 'rxjs';
import {SchemaService} from "../../../services/schema.service";
import {DataService} from "../../../services/data.service";
import {ConfigurationService} from "../../../services/configuration.service";
import {ActivatedRoute, Router} from "@angular/router";
import "enjoyhint/jquery.enjoyhint";
import * as EnjoyHint from "enjoyhint/index";
import * as $ from "jquery";
import * as d3 from "d3";


@Component({
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {

  private destroy$: Subject<void> = new Subject<void>();
  userPictureOnly: boolean = false;
  user: any;

  themes = [
    {
      value: 'default',
      name: 'Light',
    },
    {
      value: 'dark',
      name: 'Dark',
    },
    {
      value: 'cosmic',
      name: 'Cosmic',
    },
    {
      value: 'corporate',
      name: 'Corporate',
    },
  ];

  currentTheme = 'default';

  userMenu = [ { title: 'Sair' } ];


   datasets = [];
   dataset_name = '';

  constructor(private sidebarService: NbSidebarService,
              private menuService: NbMenuService,
              private themeService: NbThemeService,
              private userService: UserData,
              private layoutService: LayoutService,
              private breakpointService: NbMediaBreakpointsService,

              private dataService: DataService,
              private configService: ConfigurationService,
              private schemaService: SchemaService,
              private activatedRoute: ActivatedRoute,
              private authService: NbAuthService,
              private nbTokenService: NbTokenService,
              private router: Router,
              ) {
     this.activatedRoute.params.subscribe(params => {
        const param = params['dataset'];
        if (param !== undefined) {
           this.dataset_name = param;
        } else {
           this.dataset_name = this.configService.defaultDataset;
        }
     });
     this.authService.onTokenChange().subscribe((token: NbAuthJWTToken) => {
        if (token.isValid()) {
           this.user = token.getPayload();
        }
     });
  }

  ngOnInit() {
    this.currentTheme = this.themeService.currentTheme;

    this.menuService.onItemClick()
      .pipe(
        filter(({tag}) => tag === 'user-context-menu'),
        map(({item: {title}}) => title),
      )
      .subscribe(title => {
        this.nbTokenService.clear();
        this.router.navigate(['auth/logout']);
      });

    /*
    this.userService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe((users: any) => this.user = users.eva);
    */

    const { xl } = this.breakpointService.getBreakpointsMap();
    this.themeService.onMediaQueryChange()
      .pipe(
        map(([, currentBreakpoint]) => currentBreakpoint.width < xl),
        takeUntil(this.destroy$),
      )
      .subscribe((isLessThanXl: boolean) => this.userPictureOnly = isLessThanXl);

    this.themeService.onThemeChange()
      .pipe(
        map(({ name }) => name),
        takeUntil(this.destroy$),
      )
      .subscribe(themeName => this.currentTheme = themeName);

     this.changeColor(this.dataset_name);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changeTheme(themeName: string) {
    this.themeService.changeTheme(themeName);
  }

  toggleSidebar(): boolean {
    this.sidebarService.toggle(true, 'menu-sidebar');
    this.layoutService.changeLayoutSize();

    return false;
  }

  navigateHome() {
    this.menuService.navigateHome();
    return false;
  }

  changeColor(name){
     this.datasets = [];
     for (const [key, value] of Object.entries(this.schemaService.datasets)) {
        let outlined = true;
        if(name === value.datasetName) outlined = false;
        this.datasets.push({name: value.datasetName, label: value.datasetLabel, outlined:outlined});
     }
  }

   initTour() {
      d3.select('#clear-button').dispatch('click');
      $("#header").css('z-index', 900);
      let enjoyhintInstance = new EnjoyHint({});
      let enjoyScriptSteps = [
         {
            selector: '.button-sample',
            event: 'click',
            description: '<b>QDSSUS</b> <br>É uma ferramenta criada para exploração dos dados de atenção básica <br> do Sistema Único de Saúde brasileiro. Estes são os datasets disponíveis. <br> Clique em <b>"Atendimentos"</b> para continuar.',
            showSkip: false
         },
         {
            selector: '.eh-map',
            event: 'next',
            description: 'Esta é a <b>Área do mapa interativo</b><br> A escala de cores pode ser alterada por atendimento, <br> população ou densidade (relação atendimento/população). ' +
               '<br><br>Clique em <b>"Densidade"</b> para que a escala de cores reflita <br> a quantidade de atendimentos normalizada pela população.' +
               '<br><br> Clique em <b>"Next"</b> para continuar.',
            showNext: true,
            showSkip: false
         },
         {
            selector: '.eh-graphics',
            event: 'next',
            description: 'Esta é a <b>Área de gráficos interativos</b><br> É possível alterar a posição dos gráficos <br> arrastando-os para o local desejado.'+
               ' <br> Os gráficos são automaticamente atualizados <br> conforme as seleções realizadas. <br><br> Clique em <b>"Next"</b> para continuar.',
            showNext: true,
            showSkip: false
         },
         {
            selector: '.eh-map2',
            event: 'click',
            description: 'Para começar, vamos avaliar os atendimentos de <br> um estado brasileiro. <br> Selecione um <b>estado</b>.',
            showSkip: false
         },
         {
            selector: '#eh-graphics',
            event: 'next',
            description: 'Os gráficos de barra foram atualizados <br> para exibir os dados do estado selecionado. <br><br>'+
               'É possível passar o ponteiro do mouse <br> sobre as barras nos gráficos para observar <br> os valores de cada um.'+
               '<br><br> Clique em <b>"Next"</b> para continuar.',
            showNext: true,
            showSkip: false
         },
         {
            selector: '#eh-graphics',
            event: 'next',
            description: 'Agora, vamos avaliar os atendimentos femininos. <br> Selecione a coluna de  <b>"sexo feminino"</b> <br>no gráfico de barras de SEXO.'
               +'<br><br> Clique em <b>"Next"</b> para continuar.',
            showNext: true,
            showSkip: false
         },
         {
            selector: '.flip-button',
            event: 'click',
            description: 'Todos os gráficos e o mapa foram atualizados com a seleção feita. <br>' +
               'Nos gráficos de barras, você tem a opção de ver os mesmos dados no formato <br> de tabela.' +
               '<br><br> Pressione para girar o gráfico e exibir a tabela de dados.',
            showSkip: false
         },
         {
            selector: '.eh-graph-categorical',
            event: 'next',
            description: 'Tabela de dados. <br> É possível clicar novamente na borda direita para voltar para o gráfico de barras.',
            showNext: true,
            showSkip: false
         },
         {
            selector: '#eh-graphics',
            event: 'next',
            description: 'Podemos refinar a busca, avaliando o perfil <br> de idade das pacientes do sexo feminino <br> que tiveram atendimento de urgência. <br> '+
               'Selecione <b>Atendimento de Urgência (categoria 6)</b> <br> no gráfico de barras do TIPO DE ATENDIMENTO e <br> observe as alterações nos demais gráficos. <br><br> Clique em <b>"Next"</b> para continuar.',
            showNext: true,
            showSkip: false
         },
         {
            selector: '#eh-filters',
            event: 'next',
            description: 'Você pode desfazer as seleções clicando novamente <br> nos gráficos nas barras selecionadas ou no menu de filtro. <br>'+
               'Faça alguma desmarcação e observe as alterações. <br><br> Clique em <b>"Next"</b> para continuar.',
            showNext: true,
            showSkip: false
         },
         {
            selector: '#clear-button',
            event: 'click',
            description: 'Também é possível limpar todas as seleções feitas para fazer uma nova consulta. <br><br>Clique em "Limpar Restrições".',
            showSkip: false
         },
         {
            selector: '.map-card',
            event: 'click',
            description: 'A ferramenta também permite alterar a exibição dos Estados por Municípios.' +
               '<br> Para isto, selecione <b>"Municípios"</b>. <br><br> Clique em <b>"Next"</b> para continuar.',
            showSkip: false
         },
         {
            selector: '.eh-map3',
            event: 'next',
            description: 'É possível procurar uma cidade pelo <br> seu nome na barra de busca ou diretamente no mapa.'+
               '<br> Selecione 3 municípios.'+
               '<br><br>Clique em <b>"Next"</b> para continuar.',
            showNext: true,
            showSkip: false
         },
         {
            selector: '.eh-graphics6',
            event: 'next',
            description: 'Observe que os gráficos foram atualizados <br> após a seleção do mesmo modo que o exemplo <br> anterior da seleção por estado.<br>'+
            'Também é possível explorar esses <br> dados fazendo seleções nos gráficos.'+
               '<br><br>Clique em <b>"Next"</b> para continuar.',
            showNext: true,
            showSkip: false
         },
         {
            selector: '#eh-equipes-button',
            event: 'click',
            description: 'Para realizar análise mais detalhada das equipes de atenção básica <br> podemos gerar uma lista com as equipes dos municípios selecionados.'+
               '<br><br>Clique em <b>"Avaliação de Equipes"</b> para visualizar a lista.',
            scrollAnimationSpeed : 2500,
            showSkip: false
         },
         {
            selector: '#dialogTable',
            event: 'next',
            description: '<text style="color:#717c95;"><b>Área de equipes</b><br>É possível selecionar os municípios <br> para ver os detalhes das equipes <br><br> Clique em <b>"Next"</b> para continuar.</text>',
            showNext: true,
            showSkip: false
         },
         {
            selector: '.eh-csv-export',
            event: 'click',
            description: '<b>Área de equipes</b><br>É possível exportar as tabelas resultantes no formato CSV <br><br> Clique para baixar a tabela de municípios. ', //+
               //'<br><br> Clique em <b>"Next"</b> para continuar.</text>',
            showSkip: false
         },
         {
            selector: '.eh-equipes-close',
            event: 'click',
            description: 'Obrigado, este é o fim do Tour na ferramenta QDSSUS.<br><br> Clique para finalizar o Tour.',
            showSkip: false
         }
      ];
      enjoyhintInstance.set(enjoyScriptSteps);
      enjoyhintInstance.run();
   }
}
