### Related Repositores [![Version](https://img.shields.io/badge/version-1.0-blue.svg)](https://github.com/cicerolp/qds) [![GitHub license](https://img.shields.io/github/license/cicerolp/qds.svg)](https://github.com/cicerolp/qds/blob/master/LICENSE)



- [Main Source Code](https://github.com/cicerolp/qds)
- [Web Interface built with Angular@5](https://github.com/cicerolp/qds-interface)
- [Conversion Tools](https://github.com/cicerolp/qds-tools)
- [Datasets](https://github.com/cicerolp/qds-data)


# Quantile Datacube Structure
Real-Time Exploration of Large Spatiotemporal Datasets based on Order Statistics

In recent years sophisticated data structures based on datacubes have been proposed to perform interactive visual exploration of large datasets. While powerful, these approaches overlook the important fact that aggregations used to produce datacubes do not represent the actual distribution of the data being analyzed. As a result, these methods might produce biased results as well as hide important features in the data. In this paper, we introduce the Quantile Datacube Structure (QDS) that bridges this gap by supporting interactive visual exploration based on order statistics. The idea behind our method is that while it is not possible to exactly store order statistics in a datacube it is indeed possible to do it approximately. To achieve this, QDS makes use of an efficient non-parametric distribution approximation scheme called p-digest. Furthermore, QDS employs a novel datacube indexing scheme that reduces the memory usage of previous datacube methods. This enables interactive slicing and dicing while accurately approximating the distribution of quantitative variables of interest. We present two case studies that illustrate the ability of QDS to not only build order statistics based visualizations interactively but also to perform event detection on datasets with up to hundreds of millions of records in real-time. Finally, we present extensive experimental results that validate the effectiveness of QDS regarding memory usage and accuracy in the approximation of order statistics for real-world datasets.

## How to Build (Linux, Mac and Windows are supported)

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 5.0.0.

### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

### Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
