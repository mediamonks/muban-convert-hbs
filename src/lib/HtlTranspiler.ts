import Handlebars from 'handlebars';
import Context, { IterationType } from './Context';
import ITranspiler from './ITranspiler';

export interface ProgramOptions {
  isConditionalInInverse?: boolean;
  elseIfResultList?: Array<string>;
  indent?: string;
}

export class HtlTranspiler implements ITranspiler {
  private buffer: any[];
  private parsed: hbs.AST.Program;
  private context: Context;
  private depth: number;

  constructor(input?, context?, depth = 0) {
    this.buffer = [];
    this.context = context || new Context();
    this.depth = depth;

    if (input) {
      this.parsed = Handlebars.parse(input);
      this.parseProgram(this.parsed);
    }
  }

  parseProgram(
    program: hbs.AST.Program,
    { isConditionalInInverse = false, elseIfResultList = [], indent = '' }: ProgramOptions = {},
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
          const escaped = statement.escaped ? '' : " @ context='html'";

          let variable;
          if (path.original === '@index') {
            variable = `${this.context.getCurrentScope().value}List.index`;
          } else {
            variable = this.context.getScopedVariable(path);
          }

          if (path.type === 'PathExpression') {
            this.buffer.push(`\${ ${variable}${escaped} }`);
          } else if (path.type === 'Literal') {
            throw new Error('not implemented');
          }
          break;

        case 'CommentStatement':
          this.buffer.push(`<!--/*${statement.value}*/-->`);
          break;

        case 'BlockStatement':
          // console.log('\n\nBlockStatement\n');
          // console.log(statement);

          const type = statement.path.original;
          switch (type) {
            case 'if': {
              const condition = statement.params[0];
              let scopedCondition;

              if (condition.type === 'SubExpression') {
                if ((condition as hbs.AST.SubExpression).path.original === 'condition') {
                  scopedCondition = (condition as hbs.AST.SubExpression).params
                    .map(param => {
                      if (param.type === 'PathExpression') {
                        return this.context.getScopedVariable(param as hbs.AST.PathExpression);
                      }
                      return (param as hbs.AST.StringLiteral).value;
                    })
                    .join(' ');
                }
              } else {
                scopedCondition = this.context.getScopedVariable(
                  condition as hbs.AST.PathExpression,
                );
              }

              let currentTestResult = '';
              // check for if alias
              if (
                statement.params.length === 3 &&
                (<hbs.AST.PathExpression>statement.params[1]).original === 'as'
              ) {
                currentTestResult = `${(<hbs.AST.PathExpression>statement.params[2]).original}`;
              } else if (statement.inverse) {
                ++this.context.shared.ifCounter;
                currentTestResult = `result${this.context.shared.ifCounter}`;
              }
              const testResultDeclaration = currentTestResult ? `.${currentTestResult}` : '';

              // use `else if` instead of else when this is the only if statement in an else block
              if (isConditionalInInverse) {
                const elseIfCheck = `!(${elseIfResultList.join(' || ')})`;
                this.buffer.push(
                  `\n${indent}<sly data-sly-test${testResultDeclaration}="\${ ${elseIfCheck} && ${scopedCondition} }">`,
                );
              } else {
                this.buffer.push(
                  `<sly data-sly-test${testResultDeclaration}="\${ ${scopedCondition} }">`,
                );
              }

              const t = new HtlTranspiler(null, this.context, this.depth);
              this.buffer.push(t.parseProgram(statement.program).toString());

              this.buffer.push(`</sly>`);

              // else section
              if (statement.inverse) {
                let indent = '';
                const ifContentStatement = (<any>statement.program.body
                      .concat()
                      .reverse()
                      .find(s => s.type === 'ContentStatement') || {}).original || '';

                const match = /\n([\t ]*)$/gi.exec(ifContentStatement);
                if (match && match[1]) {
                  indent = match[1];
                }

                const childElseIfResultList = elseIfResultList.concat(currentTestResult);

                // if the else body only has an 'if' statement, we can combine it into an 'else if'
                const isInverseOnlyConditional = HtlTranspiler.isOnlyCondition(statement.inverse);
                const t = new HtlTranspiler(null, this.context, this.depth);
                t.parseProgram(statement.inverse, {
                  indent,
                  isConditionalInInverse: isInverseOnlyConditional,
                  elseIfResultList: childElseIfResultList,
                });

                // child will render a `else if`
                if (!isInverseOnlyConditional) {
                  const elseCheck = `!(${childElseIfResultList.join(' || ')})`;
                  this.buffer.push(`\n${indent}<sly data-sly-test="\${ ${elseCheck} }">`);
                }

                this.buffer.push(t.toString());

                if (!isInverseOnlyConditional) {
                  this.buffer.push(`</sly>`);
                }
              }

              break;
            }

            case 'unless': {
              const firstCondition = statement.params[0];
              this.buffer.push(
                `<sly data-sly-test="\${ ${
                  (<hbs.AST.PathExpression>firstCondition).original
                } == 'false' }">`,
              );
              const t = new HtlTranspiler(null, this.context, this.depth);

              this.buffer.push(t.parseProgram(statement.program).toString());

              this.buffer.push(`</sly>`);

              break;
            }

            case 'is': {
              const firstCondition = statement.params[0];
              const secondCondition = statement.params[1];
              this.buffer.push(
                `<sly data-sly-test="\${ ${(<hbs.AST.PathExpression>firstCondition).original} == ${
                  (<hbs.AST.PathExpression>secondCondition).original
                } }">`,
              );
              const t = new HtlTranspiler(null, this.context, this.depth);

              this.buffer.push(t.parseProgram(statement.program).toString());

              this.buffer.push(`</sly>`);

              break;
            }

            case 'with': {
              const condition = statement.params[0];
              this.buffer.push(
                `<sly data-sly-test="\${ ${(<hbs.AST.PathExpression>condition).original} }">`,
              );
              const t = new HtlTranspiler(null, this.context, this.depth);

              this.buffer.push(t.parseProgram(statement.program).toString());

              this.buffer.push('</sly>');

              break;
            }

            case 'gt': {
              const firstCondition = statement.params[0];
              const secondCondition = statement.params[1];
              this.buffer.push(
                `<sly data-sly-test="\${ ${
                  (<hbs.AST.PathExpression>firstCondition).original
                } &gt; ${(<hbs.AST.PathExpression>secondCondition).original} }">`,
              );
              const t = new HtlTranspiler(null, this.context, this.depth);

              this.buffer.push(t.parseProgram(statement.program).toString());

              this.buffer.push('</sly>');

              break;
            }

            case 'each': {
              const condition = this.context.getScopedVariable(statement
                .params[0] as hbs.AST.PathExpression);
              let childContext: Context;

              if (statement.program.blockParams) {
                // {{#each foo as |key, value|}
                const blockParams = statement.program.blockParams;
                // TODO: in AEM, when iterating an object, only the key will be assigned, and value will be `condition[key]`
                // This means that we should replace the first blockParams by that
                // childContext = this.context.createChildContext([`${condition}[${blockParams[1] || 'key'}]`, ...blockParams.slice(1)]);
                const replacements = {
                  [blockParams[0]]: `${condition}[${blockParams[1] || 'key'}]`,
                };
                childContext = this.context.createChildContext(blockParams, replacements);

                // {{#each foo as |k, v|} => has 2 variable in the same context, k and v
                if (blockParams.length === 2) {
                  childContext.getCurrentScope().iterateAsObject();
                }
              } else {
                // {{#each foo}}
                childContext = this.context.createChildContext([`${condition.split('.').pop()}_i`]);
              }

              const t = new HtlTranspiler(null, childContext, this.depth + 1);
              t.parseProgram(statement.program);
              const childScope = childContext.getCurrentScope();

              // Rules:
              // - default = array
              // - when using 2 block params = object
              // - when using @key = object

              if (childScope.iterationType === IterationType.ARRAY) {
                // Array iteration
                this.buffer.push(`<sly data-sly-list.${childScope.value}="\${ ${condition} }">`);
              } else {
                // Object iteration
                let key = 'key';
                // let value = 'value';

                if (childScope.value) {
                  // value = childScope.value;
                  key = childScope.key || 'key';
                }

                // TODO 'value' cannot be used, you have to do condition[key], so that has to be renamed
                this.buffer.push(`<sly data-sly-list.${key}="\${ ${condition} }">`);
                // this.buffer.push(`{% for ${key}, ${value} in ${condition}.items %}`);
              }

              this.buffer.push(t.toString());
              this.buffer.push(`</sly>`);
              break;
            }

            default: {
              // tslint:disable-next-line:no-console
              console.log('Unsupported block ', type);

              this.buffer.push(`{{# ${type} }}`);

              const t = new HtlTranspiler(null, this.context, this.depth);
              t.parseProgram(statement.program);
              this.buffer.push(t.toString());

              this.buffer.push(`{{/${type}}}`);
            }
          }
          break;

        case 'PartialStatement': {
          // console.log('\nPartialStatement\n');
          // console.log(statement);

          let name: string;
          let templateName: string;
          if (statement.name.type === 'StringLiteral') {
            const expression = (statement.name as any) as hbs.AST.StringLiteral;
            name = `${expression.value.replace('.hbs', '.html')}`;
            const varName = 'todo';
            templateName = `lib.${varName}`;
          } else if (statement.name.type === 'SubExpression') {
            const expression = statement.name as hbs.AST.SubExpression;
            // TODO: add generic helper support, which includes lookup
            if (expression.path.original === 'lookup') {
              // TODO: add scope support, now always assumes '.' (current scope)
              const varName = (<hbs.AST.StringLiteral>expression.params[1]).value;
              name = `\${ ${varName} }`;
              templateName = `lib[${varName}]`;
            }
          } else {
            const nameParts = (<hbs.AST.PathExpression>statement.name).parts.filter(
              p => p !== 'hbs',
            );

            templateName = `lib.${nameParts[nameParts.length - 1]}`;
            name = `${nameParts.join('/')}.html`;
          }

          if (statement.params.length) {
            // TODO: AEM doesn't support pushing/replacing the context, only adding/replacing additional variables
          }

          let params = '';
          if (statement.hash) {
            params =
              ' @ ' +
              statement.hash.pairs
                .map((pair: hbs.AST.HashPair) => {
                  const key = `${pair.key}=`;
                  if (pair.value.type === 'PathExpression') {
                    return `${key}${this.context.getScopedVariable(<hbs.AST.PathExpression>(
                      pair.value
                    ))}`;
                  }
                  if (pair.value.type === 'StringLiteral') {
                    return `${key}'${(<hbs.AST.StringLiteral>pair.value).value}'`;
                  }
                  if (pair.value.type === 'NumberLiteral') {
                    return `${key}${(<hbs.AST.NumberLiteral>pair.value).value}`;
                  }
                  if (pair.value.type === 'BooleanLiteral') {
                    return `${key}${(<hbs.AST.BooleanLiteral>pair.value).value}`;
                  }
                  return '';
                })
                .filter(_ => _)
                .join(', ');
          }

          this.buffer.push(
            `<sly data-sly-use.lib="${name}" data-sly-call="\${ ${templateName}${params} }" />`,
          );

          break;
        }

        default: {
          // tslint:disable-next-line:no-console
          console.log('Unsupported statements ', statement.type);
        }
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
