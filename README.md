# muban-convert-hbs

Convert muban hbs templates to django, twig and others.

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

const django = convert(fs.readFileSync(path.resolve(__dirname, './foo.hbs'), 'utf-8'), 'dtl');
const twig = convert(fs.readFileSync(path.resolve(__dirname, 'foo.hbs'), 'utf-8'), 'twig');
```


## Documentation

View the [generated documentation](http://mediamonks.github.io/muban-convert-hbs/).


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

Look at `test/fixtures/hbs/*.hbs` vs `test/fixtures/dtl/*.dtl` to see what is run through the tests.

TODO:
  * twig
  
Currently supported output languages are:

#### Django Template Language

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

## Contribute

View [CONTRIBUTING.md](./CONTRIBUTING.md)


## Changelog

View [CHANGELOG.md](./CHANGELOG.md)


## Authors

View [AUTHORS.md](./AUTHORS.md)


## LICENSE

[MIT](./LICENSE) © MediaMonks


