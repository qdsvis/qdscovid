### Related Repositores [![Version](https://img.shields.io/badge/version-1.0-blue.svg)](https://github.com/cicerolp/qds) [![GitHub license](https://img.shields.io/github/license/cicerolp/qds.svg)](https://github.com/cicerolp/qds/blob/master/LICENSE)

- [Main Source Code](https://github.com/cicerolp/qds)
- [Web Interface built with Angular@5](https://github.com/cicerolp/qds-interface)
- [Conversion Tools](https://github.com/cicerolp/qds-tools)
- [Datasets](https://github.com/cicerolp/qds-data)

# QDSCOVID

## Quantile Datacube Structure
Real-Time Exploration of Large Spatiotemporal Datasets based on Order Statistics

In recent years sophisticated data structures based on datacubes have been proposed to perform interactive visual exploration of large datasets. While powerful, these approaches overlook the important fact that aggregations used to produce datacubes do not represent the actual distribution of the data being analyzed. As a result, these methods might produce biased results as well as hide important features in the data. In this paper, we introduce the Quantile Datacube Structure (QDS) that bridges this gap by supporting interactive visual exploration based on order statistics. The idea behind our method is that while it is not possible to exactly store order statistics in a datacube it is indeed possible to do it approximately. To achieve this, QDS makes use of an efficient non-parametric distribution approximation scheme called p-digest. Furthermore, QDS employs a novel datacube indexing scheme that reduces the memory usage of previous datacube methods. This enables interactive slicing and dicing while accurately approximating the distribution of quantitative variables of interest. We present two case studies that illustrate the ability of QDS to not only build order statistics based visualizations interactively but also to perform event detection on datasets with up to hundreds of millions of records in real-time. Finally, we present extensive experimental results that validate the effectiveness of QDS regarding memory usage and accuracy in the approximation of order statistics for real-world datasets.

## Dependencies

QDSCOVID requires:

* [npm](https://www.npmjs.com/)

* [Angular](https://angular.io/) 8:

	```bash
	sudo npm install -g @angular/cli@latest
	```

* [Nodei.js](https://nodejs.org) 10:

	```bash
	sudo npm cache clean -f
	sudo npm install -g n
	sudo n stable
	```

## Installation

Do `npm install` and after change the line 14 of file `./node_modules/md2/core/common-behaviors/common-module.js` by:

```javascript
import { DOCUMENT } from "@angular/common";
```

## Running

`ng serve --host=0.0.0.0 --port 4200`

## Deploy

First, build:

`ng build --base-href http://www.qdsvis.tk/qdscovid/`

Then, pass the files generated to page of the project:

`ngh --branch=page`

Finally, open the page in a browser: [Link](http://www.qdsvis.tk/qdscovid)
