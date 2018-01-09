import Handlebars, { Exception } from 'handlebars';
import { String } from 'shelljs';

const convert = input => {
  const transpiler = new Transpiler(input);
  const output = transpiler.toString();
  return output;
};

enum ScopeType {
  EachHash,
  EachArray,
  EachArrayWithParams,
  EachHashWithParams,
}

class Scope {
  public variables: string[];
  public type: ScopeType;

  constructor(variables: string[], type: ScopeType) {
    this.variables = variables;
    this.type = type;
  }
}

class Scopes {
  private scopes: Scope[];

  constructor() {
    this.scopes = [];
  }

  push(variables: string[], scopeType: ScopeType) {
    this.scopes.push(new Scope(variables, scopeType));
  }

  getScope(depth) {
    return this.scopes[depth - 1];
  }

  getScopedVariable(depth: number, varName: string) {
    if (depth - 1 < 0)
      // upper level is root
      return varName;

    const scope = this.getScope(depth);
    const vars = varName.split('.');

    if (vars.length === 2) {
      return varName;
    }

    if (scope.variables.includes(varName)) {
      return varName;
    }

    return [scope.variables[0], varName].join('.');
  }
}

class Transpiler {
  private buffer: any[];
  private parsed: hbs.AST.Program;
  private scopes: Scopes;
  private depth: number;

  constructor(input?, scopes?, depth = 0) {
    this.buffer = [];
    this.scopes = scopes || new Scopes();
    this.depth = depth;

    if (input) {
      this.parsed = Handlebars.parse(input);
      this.parseProgram(this.parsed);
    }
  }

  parseProgram(program: hbs.AST.Program, isConditionalInInverse: boolean = false) {
    // console.log('\n\n -- PROGRAM -- \n');
    // console.log(program);
    program.body.forEach((statement: hbs.AST.ProgramStatement) => {
      switch (statement.type) {
        case 'ContentStatement':
          this.buffer.push(statement.original);
          break;

        case 'MustacheStatement':
          // console.log('\n\nMustacheStatement\n');
          // console.log(statement);
          const path = <hbs.AST.PathExpression>statement.path;
          const escaped = statement.escaped ? '' : '|safe';

          let variable;
          if (path.original === 'this') {
            variable = this.scopes.getScope(this.depth).variables[0];
          } else if (path.original === '@index') {
            variable = 'forloop.counter0';
          } else if (path.original === '@key') {
            // TODO: support "@../key"
            // variable = 'key';
            variable = 'forloop.counter0';
          } else {
            variable = this.scopes.getScopedVariable(this.depth, path.parts.join('.'));
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
              const scopedCondition = this.scopes.getScopedVariable(this.depth, condition);

              // use `else if` instead of else when this is the only if statement in an else block
              this.buffer.push(`{% ${isConditionalInInverse ? 'el' : ''}if ${scopedCondition} %}`);
              const t = new Transpiler(null, this.scopes, this.depth);
              this.buffer.push(t.parseProgram(statement.program).toString());

              if (statement.inverse) {
                // else section
                const isInverseOnlyConditional = Transpiler.isOnlyCondition(statement.inverse);
                const t = new Transpiler(null, this.scopes, this.depth);
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
              let condition = statement.params.map(createPath).join(' ');
              let scope = '';

              if (statement.program.blockParams) {
                // {{#each foo as |key, value|}
                const blockParams = statement.program.blockParams;
                // {{#each foo as |k, v|} => has 2 variable in the same context, k and v
                if (blockParams.length === 1) {
                  this.scopes.push(blockParams, ScopeType.EachArrayWithParams);

                  if (condition.indexOf('.') < 0) {
                    condition = this.scopes.getScopedVariable(this.depth, condition);
                  }

                  this.buffer.push(`{% for ${blockParams[0]} in ${condition} %}`);
                } else if (blockParams.length === 2) {
                  this.scopes.push(blockParams, ScopeType.EachHashWithParams);
                  this.buffer.push(
                    `{% for ${blockParams[1]}, ${blockParams[0]} in ${condition}.items %}`,
                  );
                } else {
                  throw new Error("We don't support more than 2 scope variables ");
                }
              } else {
                // {{#each foo}}
                scope = `${condition}_i`;
                this.scopes.push([scope], ScopeType.EachArray);
                // TODO: detect 'key' in child programs, can be tricky with nested blocks that might reference using @../key
                this.buffer.push(`{% for ${scope} in ${condition} %}`);
              }
              const t = new Transpiler(null, this.scopes, this.depth + 1);
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
