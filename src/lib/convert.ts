import Handlebars, { Exception } from 'handlebars';
import { String } from 'shelljs';

const convert = input => {
  const transpiler = new Transpiler(input);
  const output = transpiler.toString();
  return output;
};

class Contexts {
  private _contexts: any[];

  constructor() {
    this._contexts = [];
  }

  push(s) {
    this._contexts.push(s);
  }

  getScope(depth) {
    return this._contexts[depth - 1];
  }

  getScopedVariable(depth, varName) {
    const sc = this.getScope(depth);
    if (typeof sc === 'undefined') {
      return varName;
    }
    // if context has 2 variables as in {each foo |k, v|}
    // we dont have to bind variables
    // as user will use {{v.attribute}} etc.
    if (sc.length === 2) return varName;

    return [sc, varName].join('.');
  }
}

const assertType = (cond: any, type: string) => {
  if (typeof cond !== type) {
    throw new Error('should be ' + type + ' :' + typeof cond);
  }
};

class Transpiler {
  private buffer: any[];
  private parsed: hbs.AST.Program;
  private contexts: Contexts;
  private depth: number;

  constructor(input?, contexts?, depth = 0) {
    this.buffer = [];
    this.contexts = contexts || new Contexts();
    this.depth = depth;

    if (input) {
      this.parsed = Handlebars.parse(input);
      this.parseProgram(this.parsed);
    }
  }

  parseProgram(program: hbs.AST.Program, isConditionalInInverse: boolean = false) {
    // console.log('\n\n -- PROGRAM -- \n');
    // console.log(program);
    assertType(isConditionalInInverse, 'boolean');

    program.body.forEach((statement: hbs.AST.ProgramStatement) => {
      switch (statement.type) {
        case 'ContentStatement':
          this.buffer.push(statement.original);
          break;

        case 'MustacheStatement':
          // console.log('\n\nMustacheStatement\n');
          // console.log(statement);
          const scope = this.contexts.getScope(this.depth);

          const path = <hbs.AST.PathExpression>statement.path;
          const escaped = statement.escaped ? '' : '|safe';

          let variable;
          if (path.original === 'this') {
            variable = scope;
          } else if (path.original === '@index') {
            variable = 'forloop.counter0';
          } else if (path.original === '@key') {
            // TODO: support "@../key"
            // variable = 'key';
            variable = 'forloop.counter0';
          } else {
            variable = this.contexts.getScopedVariable(this.depth, path.parts.join('.'));
          }

          if (path.type === 'PathExpression') {
            this.buffer.push(`{{ ${variable}${escaped} }}`);
          } else if (path.type === 'Literal') {
            throw new Error('not implemented');
          }
          break;

        case 'CommentStatement':
          this.buffer.push(`{#${statement.value}#}`);
          break;

        case 'BlockStatement':
          // console.log('\n\nBlockStatement\n');
          // console.log(statement);

          const type = statement.path.original;
          switch (type) {
            case 'if': {
              const condition = statement.params.map(createPath).join(' ');
              const scopedCondition = this.contexts.getScopedVariable(this.depth, condition);

              // use `else if` instead of else when this is the only if statement in an else block
              this.buffer.push(`{% ${isConditionalInInverse ? 'el' : ''}if ${scopedCondition} %}`);
              const t = new Transpiler(null, this.contexts, this.depth);
              this.buffer.push(t.parseProgram(statement.program).toString());

              if (statement.inverse) {
                // else section
                const isInverseOnlyConditional = Transpiler.isOnlyCondition(statement.inverse);
                const t = new Transpiler(null, this.contexts, this.depth);
                t.parseProgram(statement.inverse, isInverseOnlyConditional);

                // child will render a `else if`
                if (!isInverseOnlyConditional) {
                  this.buffer.push(`{% else %}`);
                }
                this.buffer.push(t.toString());
              }

              // parent will close this
              if (!isConditionalInInverse) {
                this.buffer.push(`{% endif %}`);
              }
              break;
            }

            case 'each': {
              const condition = statement.params.map(createPath).join(' ');
              let scope = '';

              if (statement.program.blockParams) {
                // {{#each foo as |key, value|}
                const blockParams = statement.program.blockParams;
                // {{#each foo as |k, v|} => has 2 variable in the same context, k and v
                this.contexts.push([blockParams[0], blockParams[1]]);
                this.buffer.push(
                  `{% for ${blockParams[1]}, ${blockParams[0]} in ${condition}.items %}`,
                );
              } else {
                // {{#each foo}}
                scope = `${condition}_i`;
                this.contexts.push(scope);
                // TODO: detect 'key' in child programs, can be tricky with nested blocks that might reference using @../key
                this.buffer.push(`{% for ${scope} in ${condition} %}`);
              }
              const t = new Transpiler(null, this.contexts, this.depth + 1);
              this.buffer.push(t.parseProgram(statement.program).toString());
              this.buffer.push(`{% endfor %}`);
              break;
            }
          }
          break;
      }
    });

    return this;
  }

  /**
   * Checks if this sub-program has only a condition statement.
   * If that's the case, and used in a inverse (else) section, the parent should render `else if`
   * instead of an `if` nested in an `else`.
   * @param {hbs.AST.Program} program
   * @return {boolean}
   */
  static isOnlyCondition(program: hbs.AST.Program): boolean {
    return (
      program.body.length === 1 &&
      program.body[0].type === 'BlockStatement' &&
      (<hbs.AST.BlockStatement>program.body[0]).path.original === 'if'
    );
  }

  toString(): string {
    return this.buffer.reduce((str, op) => {
      return str + op;
    }, '');
  }
}

const createPath = (path: hbs.AST.PathExpression) => path.parts.join('.');

export default convert;
