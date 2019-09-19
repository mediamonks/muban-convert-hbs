import fs from 'fs';
import path from 'path';
import 'mocha';
import { expect } from 'chai';
import { HtlTranspiler } from '../src/lib/HtlTranspiler';

describe('convert from hbs to htl', () => {
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
    'if/if-complex',
    'for/for',
    'for/for-data',
    'for/for-index',
    'for/for-blockparams',
    'for/for-nested-variable',
    // 'for/for-key', // array loops don't ever have a key in HTL
    'for/nested-for-blockparams',
    'for/nested-for-conditional',
    'for/nested-for-data',
    'partial/basic',
    // 'partial/context', // not supported in HTL
    'partial/dynamic',
    'partial/parameters',
    'unknown/unknown',
  ];

  tests.forEach(value => {
    it(`should convert "${value}"`, () => {
      const expected = fs.readFileSync(path.resolve(__dirname, `./fixtures/${value}.htl`), 'utf-8');
      const actual = new HtlTranspiler(
        fs.readFileSync(path.resolve(__dirname, `./fixtures/${value}.hbs`), 'utf-8'),
      ).toString();

      expect(actual).to.equal(expected);
    });
  });
});
