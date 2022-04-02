import { IterationCache } from "./iteration-cache";
import { hash } from "./utils/hash";
import { randomlySelectValueByProbability } from "./utils/random";

type ContextIdentifier = string | string[];

type StochasticSuccessor<Params extends object = {}> = {
  successor: Successor<Params>;
  probability: number;
}[];

type FunctionSuccessor<Params extends object = {}> = (context: {
  currentSymbolState: SymbolState<Params>;
  parentSymbolState?: SymbolState<Params>;
  prevSymbolState?: SymbolState<Params>;
  nextSymbolState?: SymbolState<Params>;
}) => SymbolState<Params>;

type Successor<Params extends object = {}> =
  | SymbolState<Params>
  | FunctionSuccessor<Params>
  | StochasticSuccessor<Params>;

type RuleDefinition<Params extends object = {}> = {
  symbol: string;
  /** match only if the previous Symbol equaled prevSymbol (string) or if the
   * previous symbol was one of prevSymbol (string[]) */
  prevSymbol?: ContextIdentifier;
  /** match only if the next Symbol equaled nextSymbol (string) or if the next
   * symbol was one of nextSymbol (string[]) */
  nextSymbol?: ContextIdentifier;
  successor: Successor<Params>;
};

type SystemState<Params extends object = {}> = SymbolState<Params>[];

type SymbolState<Params extends object = {}> = {
  symbol: string;
  params: Params;
  branch?: SystemState<Params>;
};

export class LSystem<Params extends object = {}> {
  private _iteration: number;
  private _cache: IterationCache<Params>;
  private _rules: Map<string, RuleDefinition<Params>>;
  private _systemId: number;
  private _initial: SystemState<Params>;

  constructor({
    rules,
    initial,
  }: {
    initial: SystemState<Params>;
    rules?: { [x: string]: RuleDefinition<Params> };
  }) {
    this._cache = new IterationCache();
    this._rules = new Map(rules ? Object.entries(rules) : []);
    this._initial = initial;
    this.recalculateSystemHash();
  }

  addRule(rule: RuleDefinition<Params>) {
    this._rules.set(rule.symbol, rule);
    this.recalculateSystemHash();
  }

  removeRule(rule: Omit<RuleDefinition<Params>, "successor">) {
    if (!this._rules.has(rule.symbol)) {
      throw new Error(
        `Cannot remove rule for symbol ${rule.symbol}, it was not found!`
      );
    }
    this._rules.delete(rule.symbol);
    this.recalculateSystemHash();
  }

  recalculateSystemHash() {
    const identifierString =
      JSON.stringify(this._initial) +
      JSON.stringify(Array.from(this._rules.entries()));
    this._systemId = hash(identifierString);
  }

  get iteration() {
    return this._iteration;
  }

  get systemHash() {
    return this._systemId;
  }

  cleanCache() {
    this._cache.cleanCache();
  }

  getOutput(n: number, bypassCache = false) {
    this._iteration = n;

    if (!bypassCache) {
      const cachedOutput = this._cache.requestIteration(this.systemHash, n);
      if (cachedOutput) {
        return cachedOutput;
      }
    }
  }

  getOutputForIteration(n: number, recalculateAllIterations = false) {
    let currIteration = 0;
    let currResult = this._initial;

    if (!recalculateAllIterations) {
      while (typeof currResult === "undefined") {
        const cachedValue = this._cache.requestIteration(
          this.systemHash,
          n - 1
        );
        if (cachedValue) {
          currIteration = n - 1;
          currResult = cachedValue;
        }
      }
    }

    while (currIteration < n) {
      currResult = this.applyRules(currResult, n);
      currIteration = n + 1;

      this._cache.setIterationCacheEntry(
        this.systemHash,
        currIteration,
        currResult
      );
    }
  }

  applyRules(
    input: SystemState<Params>,
    iteration: number,
    parentSymbolState?: SymbolState<Params>
  ) {
    let result = input;
    this._rules.forEach((def) => {
      result = this.applyRule(result, def, iteration, parentSymbolState);
    });

    return result;
  }

  applyRule(
    input: SystemState<Params>,
    rule: RuleDefinition<Params>,
    iteration: number,
    parentSymbolState?: SymbolState<Params>
  ) {
    return input.reduce<SystemState<Params>>(
      (acc, currentSymbolState, currentIndex) => {
        const prevSymbolState = acc[currentIndex - 1];
        const nextSymbolState = acc[currentIndex + 1];

        // Early return if the symbol does not match
        if (currentSymbolState.symbol !== rule.symbol) {
          return [...acc, currentSymbolState];
        }

        // Early return if the rule.nextSymbol is not matched
        if (
          nextSymbolState &&
          rule.nextSymbol &&
          ((typeof rule.nextSymbol === "string" &&
            nextSymbolState.symbol !== rule.nextSymbol) ||
            (Array.isArray(rule.nextSymbol) &&
              !rule.nextSymbol.includes(nextSymbolState.symbol)))
        ) {
          return [...acc, currentSymbolState];
        }

        // Early return if the rule.prevSymbol is not matched
        if (
          prevSymbolState &&
          rule.prevSymbol &&
          ((typeof rule.prevSymbol === "string" &&
            prevSymbolState.symbol !== rule.prevSymbol) ||
            (Array.isArray(rule.prevSymbol) &&
              !rule.prevSymbol.includes(prevSymbolState.symbol)))
        ) {
          return [...acc, currentSymbolState];
        }

        // is branch symbol, perform replacement on the branch symbols first
        if (currentSymbolState.branch) {
          currentSymbolState.branch = this.applyRules(
            currentSymbolState.branch,
            iteration,
            currentSymbolState
          );
        }

        return [
          ...acc,
          this.applyRuleOnSymbol({
            currentSymbolState,
            iteration,
            rule,
            nextSymbolState,
            prevSymbolState,
            parentSymbolState,
          }),
        ];
      },
      [] as SystemState<Params>
    );
  }

  applyRuleOnSymbol({
    currentSymbolState,
    rule,
    iteration,
    prevSymbolState,
    nextSymbolState,
    parentSymbolState,
  }: {
    currentSymbolState: SymbolState<Params>;
    rule: RuleDefinition<Params>;
    iteration: number;
    prevSymbolState?: SymbolState<Params>;
    nextSymbolState?: SymbolState<Params>;
    parentSymbolState?: SymbolState<Params>;
  }) {
    // StochasticSuccessor
    if (Array.isArray(rule.successor)) {
      return this.applyRuleOnSymbol({
        currentSymbolState,
        rule: {
          ...rule,
          successor: randomlySelectValueByProbability(rule.successor).successor,
        },
        iteration,
        prevSymbolState,
        nextSymbolState,
        parentSymbolState,
      });
    }

    // FunctionSuccessor
    if (typeof rule.successor === "function") {
      return rule.successor({
        currentSymbolState,
        prevSymbolState,
        nextSymbolState,
        parentSymbolState,
      });
    }

    // SuccessorDefinition is a simple SymbolState object
    if (typeof rule.successor.symbol !== "undefined") {
      return rule.successor.symbol;
    }

    throw new Error(
      "A rule was matched but there was no valid successor defined!"
    );
  }
}
