# muban-convert-hbs

Convert Handlebars templates to HTL, django, twig and others. It supports all of the commonly used
features, and will add support for additional Handlebars Helpers to implement additional features
that are popular in the target template language.

Handbelars templates are used in Muban to optimize frontend development for server-rendered HTML
pages. This module is used to convert the development templates into server templates that can be
used for the actual implementation, without having to do that manually.

Using this module doesn't guarantee 100% perfect target templates, so some manual checking is
required to make sure the resulting templates are doing what is intended.

## Installation

```sh
yarn add muban-convert-hbs
```

```sh
npm i -S muban-convert-hbs
```

## Basic usage

```ts
import fs from 'fs';
import path from 'path';
import convert from 'muban-convert-hbs';
// var convert = require('muban-convert-hbs').default; // when using es5

const htl = convert(fs.readFileSync(path.resolve(__dirname, './foo.hbs'), 'utf-8'), 'htl');
const django = convert(fs.readFileSync(path.resolve(__dirname, './foo.hbs'), 'utf-8'), 'django');
const twig = convert(fs.readFileSync(path.resolve(__dirname, 'foo.hbs'), 'utf-8'), 'twig');
```

## Building

In order to build muban-convert-hbs, ensure that you have [Git](http://git-scm.com/downloads)
and [Node.js](http://nodejs.org/) installed.

Clone a copy of the repo:
```sh
git clone https://github.com/mediamonks/muban-convert-hbs.git
```

Change to the muban-convert-hbs directory:
```sh
cd muban-convert-hbs
```

Install dev dependencies:
```sh
yarn
```

Use one of the following main scripts:
```sh
yarn build            # build this project
yarn dev              # run compilers in watch mode, both for babel and typescript
yarn test             # run the unit tests incl coverage
yarn test:dev         # run the unit tests in watch mode
yarn lint             # run eslint and tslint on this project
yarn doc              # generate typedoc documentation
```

When installing this module, it adds a pre-commit hook, that runs lint and prettier commands
before committing, so you can be sure that everything checks out.

## Support

Look at the [test fixtures](./test/fixtures/) to see what is run through the tests.

In general, the following features are supported:

* variables
* raw
* comments
* if
  * else
  * else if
* each
  * scoping
  * this
  * @key
  * @index
  * as |block params|
* partials
  * passing context
  * passing parameters
  * dynamic using the lookup helper


Please check this pages for more information about the supported template languages and the exact
features that are supported there:

* [HTL](./docs/support-htl.md)
* [Django](./docs/support-dtl.md)
* [Twig](./docs/support-twig.md)

## Contribute

View [CONTRIBUTING.md](./CONTRIBUTING.md)


## Changelog

View [CHANGELOG.md](./CHANGELOG.md)


## Authors

View [AUTHORS.md](./AUTHORS.md)


## LICENSE

[MIT](./LICENSE) © MediaMonks


