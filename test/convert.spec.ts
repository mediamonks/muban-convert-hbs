import 'mocha';
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import convert from '../src/lib/convert';

describe('convert', () => {
  describe('from hbs to dtl', () => {
    // prettier-ignore
    const tests = [
      'nested-for-conditional',
      'nested-for-data',
      'comment',
      'variable',
      'raw',
      'if',
      'if-else',
      'if-elseif',
      'if-else-if',
      'if-elseif-else',
      'for',
      'for-data',
      'for-index',
      'for-key',
      'for-blockparams',
    ];

    tests.forEach(value => {
      it(`should convert "${value}"`, () => {
        const expected = fs.readFileSync(
          path.resolve(__dirname, `./fixtures/dtl/${value}.dtl`),
          'utf-8',
        );
        const actual = convert(
          fs.readFileSync(path.resolve(__dirname, `./fixtures/hbs/${value}.hbs`), 'utf-8'),
        );

        expect(actual).to.equal(expected);
      });
    });
  });
});
