import Handlebars from 'handlebars';

const convert = input => {
  const transpiler = new Transpiler(input);
  const output = transpiler.toString();
  return output;
};

class Transpiler {
  private buffer: any[];
  private parsed: hbs.AST.Program;

  constructor(input?) {
    this.buffer = [];
    if (input) {
      this.parsed = Handlebars.parse(input);
      this.parseProgram(this.parsed);
    }
  }

  parseProgram(
    program: hbs.AST.Program,
    scope: string = '',
    isConditionalInInverse: boolean = false,
  ) {
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
            variable = scope;
          } else if (path.original === '@index') {
            variable = 'forloop.counter0';
          } else if (path.original === '@key') {
            // TODO: support "@../key"
            variable = 'key';
          } else {
            const scoped = scope ? `${scope}.` : '';
            variable = scoped + path.parts.join('.');
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
              // use `else if` instead of else when this is the only if statement in an else block
              this.buffer.push(`{% ${isConditionalInInverse ? 'el' : ''}if ${condition} %}`);
              this.buffer.push(new Transpiler().parseProgram(statement.program).toString());

              if (statement.inverse) {
                // else section
                const isInverseOnlyConditional = Transpiler.isOnlyCondition(statement.inverse);
                const t = new Transpiler();
                t.parseProgram(statement.inverse, '', isInverseOnlyConditional);

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
                this.buffer.push(`{% for ${blockParams[1]}, ${blockParams[0]} in ${condition} %}`);
              } else {
                // {{#each foo}}
                scope = `${condition}_i`;
                // TODO: detect 'key' in child programs, can be tricky with nested blocks that might reference using @../key
                this.buffer.push(`{% for key, ${scope} in ${condition} %}`);
              }
              this.buffer.push(new Transpiler().parseProgram(statement.program, scope).toString());
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
