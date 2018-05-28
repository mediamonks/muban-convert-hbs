import fs from 'fs';
import path from 'path';
import 'mocha';
import { expect } from 'chai';
import { DjangoTranspiler } from '../src/lib/DjangoTranspiler';

describe('convert from hbs to dtl', () => {
  // prettier-ignore
  const tests = [
      'comment/comment',
      'condition/condition',
      'variable/variable',
      'variable/upper-context-variables',
      'raw/raw',
      'if/if',
      'if/if-else',
      'if/if-elseif',
      'if/if-else-if',
      'if/if-elseif-else',
      'for/for',
      'for/for-data',
      'for/for-index',
      'for/for-blockparams',
      'for/for-key',
      'for/nested-for-blockparams',
      'for/nested-for-conditional',
      'for/nested-for-data',
      'partial/basic',
      'partial/context',
      'partial/dynamic',
      'partial/parameters',
      'unknown/unknown',
    ];

  tests.forEach(value => {
    it(`should convert "${value}"`, () => {
      const expected = fs.readFileSync(path.resolve(__dirname, `./fixtures/${value}.dtl`), 'utf-8');
      const actual = new DjangoTranspiler(
        fs.readFileSync(path.resolve(__dirname, `./fixtures/${value}.hbs`), 'utf-8'),
      ).toString();

      expect(actual).to.equal(expected);
    });
  });
});
