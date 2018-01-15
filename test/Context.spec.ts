import Handlebars from 'handlebars';
import 'mocha';
import { expect } from 'chai';
import Context from '../src/lib/Context';

describe('Context', () => {
  describe('on root depth', () => {
    it(`should leave variable in tact`, () => {
      const context = new Context();

      const actual = context.getScopedVariable(createPathExpression('name'));
      const expected = 'name';

      expect(actual).to.deep.equal(expected);
    });
  });

  describe('in a for loop with users', () => {
    it(`should prepend users before variable`, () => {
      const rootContext = new Context();
      const context = rootContext.createChildContext(['users']);

      const actual = context.getScopedVariable(createPathExpression('name'));
      const expected = 'users.name';

      expect(actual).to.deep.equal(expected);
    });

    it(`should resolve variable in parent scope`, () => {
      const rootContext = new Context();
      const context = rootContext.createChildContext(['users']);

      const actual = context.getScopedVariable(createPathExpression('../name'));
      const expected = 'name';

      expect(actual).to.deep.equal(expected);
    });
  });

  describe('in a double for loop with users and posts', () => {
    it(`should prepend comments before variable in current scope`, () => {
      const rootContext = new Context();
      const usersContext = rootContext.createChildContext(['users']);
      const context = usersContext.createChildContext(['comments']);

      const actual = context.getScopedVariable(createPathExpression('name'));
      const expected = 'comments.name';

      expect(actual).to.deep.equal(expected);
    });

    it(`should prepend users before variable in current parent`, () => {
      const rootContext = new Context();
      const usersContext = rootContext.createChildContext(['users']);
      const context = usersContext.createChildContext(['comments']);

      const actual = context.getScopedVariable(createPathExpression('../name'));
      const expected = 'users.name';

      expect(actual).to.deep.equal(expected);
    });

    it(`should resolve variable in root scope`, () => {
      const rootContext = new Context();
      const usersContext = rootContext.createChildContext(['users']);
      const context = usersContext.createChildContext(['comments']);

      const actual = context.getScopedVariable(createPathExpression('../../name'));
      const expected = 'name';

      expect(actual).to.deep.equal(expected);
    });
  });
});

const createPathExpression = (expression: string): hbs.AST.PathExpression =>
  (<hbs.AST.MustacheStatement>Handlebars.parse(`{{ ${expression} }}`).body[0])
    .path as hbs.AST.PathExpression;
