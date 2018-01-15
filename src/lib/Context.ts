/**
 * Holds information about the current Handlebars Context.
 * A new context is created when traversing inside a block that introduces new variables, e.g. 'each'
 *
 * Creating a child context is done by calling context.createChildContext([variables in scope]).
 * This will clone the current context, append the new scope, and increase the depth
 */
export default class Context {
  /**
   * A list of scopes, length should correspond with `depth-1`
   */
  private scopes: Scope[];
  /**
   * Context depth, will be increased when creating a child context
   */
  private depth: number;

  constructor() {
    // create empty scope at root level
    this.scopes = [new Scope([])];
    // set initial depth to 0
    this.depth = 0;
  }

  /**
   * Add new values to the context and return the new context. The current context remains untouched.
   * @param {string[]} variables
   * @return {Context} A new context.
   */
  createChildContext(variables: Array<string>) {
    const context = this.clone();
    context.scopes.push(new Scope(variables));
    ++context.depth;
    return context;
  }

  /**
   * Gets the scope for a given depth
   *
   * @param {number} depth
   * @return {Scope}
   */
  private getScope(depth: number): Scope {
    return this.scopes[depth];
  }

  public getCurrentScope(): Scope {
    return this.scopes[this.scopes.length - 1];
  }

  /**
   * Gets all the available variables available in the scopes up to the given depth.
   * Can be used to see if a variable is explicitly referencing a scope variable
   * @param {number} depth
   * @return {Array<string>}
   */
  getScopesToDepth(depth: number): Array<string> {
    // NOTE: contains duplicates, but doesn't matter
    return this.scopes.slice(0, depth + 1).reduce((acc, scope) => acc.concat(scope.variables), []);
  }

  getScopedVariable(path: hbs.AST.PathExpression) {
    // get the depth the variable is referencing (path.depth is higher when using ../)
    const varDepth = this.depth - path.depth;

    if (varDepth === 0) {
      // upper level is root, which has no scope vars, so do early exit
      return path.parts.join('.');
    }

    // if the variable doesn't match anything explicitly, and is not in the root scope,
    // we must prepend it with the current scope value (at least for 'each' blocks)
    const currentScope = this.getScope(varDepth);

    // {{ this }}
    if (path.parts.length === 0) {
      return currentScope.value;
    }

    // {{ @key }}
    if (path.original === '@key') {
      // when no key is provided by `|value key|`, it will be added in the output template by default
      if (!currentScope.key) {
        currentScope.iterateAsObject();
      }
      return currentScope.key || 'key';
    }

    // get the scope by traversing up to a certain parent depth
    // when using ../ in the variable, the depth will lower
    // this will build op all explicit scope variables from the root up to the provided depth
    const scopeVariables = this.getScopesToDepth(varDepth);

    // if the first path of the variable already in the current scope, or any
    if (scopeVariables.includes(path.parts[0])) {
      return path.parts.join('.');
    }

    return [currentScope.value, path.parts].join('.');
  }

  // clone the current Context
  public clone(): Context {
    const context = new Context();
    context.scopes = this.scopes.concat();
    context.depth = this.depth;
    return context;
  }
}

/**
 * Internal scope class, created when increasing the context depth.
 * Contains all the variables in the new scope.
 */
export class Scope {
  public iterationType: string = IterationType.ARRAY;
  public variables: Array<string>;

  // alias vars for easy reference, these ones are for the `each` loop
  public value: string;
  public key: string;

  constructor(variables: Array<string>) {
    this.variables = variables;

    // NOTE: might require additional info if we handle other type of blockParam variables
    this.value = this.variables[0];
    this.key = this.variables[1] || undefined;
  }

  public iterateAsObject() {
    this.iterationType = IterationType.OBJECT;
  }
}

export enum IterationType {
  ARRAY = 'array',
  OBJECT = 'object',
}
