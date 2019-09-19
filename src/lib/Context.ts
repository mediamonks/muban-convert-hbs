export type ReplacementMap = { [key: string]: string };
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

  /**
   * object will be shared between parent and child contexts
   */
  public shared: {
    ifCounter: number;
  };

  constructor() {
    // create empty scope at root level
    this.scopes = [new Scope([])];
    // set initial depth to 0
    this.depth = 0;

    this.shared = {
      ifCounter: 0,
    };
  }

  /**
   * Add new values to the context and return the new context. The current context remains untouched.
   * @param {string[]} variables
   * @param replacements
   * @return {Context} A new context.
   */
  createChildContext(variables: Array<string>, replacements?: ReplacementMap) {
    const context = this.clone();
    context.scopes.push(new Scope(variables, replacements));
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
  getScopesToDepth(
    depth: number,
  ): { variables: Array<string>; replacements: Array<ReplacementMap> } {
    // NOTE: contains duplicates, but doesn't matter
    const mergedScope = { variables: [], replacements: [] };
    this.scopes.slice(0, depth + 1).forEach(scope => {
      if (scope.variables) {
        mergedScope.variables.push(...scope.variables);
      }
      if (scope.replacements) {
        mergedScope.replacements = { ...mergedScope.replacements, ...scope.replacements };
      }
    });
    return mergedScope;
  }

  getScopedVariable(path: hbs.AST.PathExpression) {
    // get the depth the variable is referencing (path.depth is higher when using ../)
    const varDepth = this.depth - path.depth;

    // console.log('getScopedVariable', path);

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
    const { variables, replacements } = this.getScopesToDepth(varDepth);

    // if the first path of the variable already in the current scope, or any parents
    if (variables.includes(path.parts[0])) {
      const match = path.parts.join('.');
      if (match in replacements) {
        return replacements[match];
      }
      return match;
    }

    // console.log(' >> ', currentScope.value, path.parts);
    return [currentScope.value, ...path.parts].join('.');
  }

  // clone the current Context
  public clone(): Context {
    const context = new Context();
    context.scopes = this.scopes.concat();
    context.depth = this.depth;
    context.shared = this.shared;
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
  public replacements: ReplacementMap;

  // alias vars for easy reference, these ones are for the `each` loop
  public value: string;
  public key: string;

  constructor(variables: Array<string>, replacements?: ReplacementMap) {
    this.variables = variables;
    this.replacements = replacements;

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
