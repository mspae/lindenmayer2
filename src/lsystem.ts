import { IterationCache } from "./iteration-cache";
import { randomlySelectValueByProbability } from "./utils/random";
import { SymbolState, SymbolListState } from "./utils/state";

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
  | SymbolState<Params>[]
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

export class LSystem<Params extends object = {}> {
  private _cache: IterationCache<Params>;
  private _rules: Map<string, RuleDefinition<Params>>;
  private _initial: SymbolListState<Params>;

  constructor({
    rules,
    initial,
  }: {
    initial: SymbolListState<Params>;
    rules?: RuleDefinition<Params>[];
  }) {
    this._cache = new IterationCache();
    this._rules = new Map(
      rules
        ? rules.reduce((acc, rule) => [...acc, [rule.symbol, rule]], [])
        : []
    );
    this._initial = initial;
    this._cache.cleanCache();
  }

  addRule(rule: RuleDefinition<Params>) {
    this._rules.set(rule.symbol, rule);
    this._cache.cleanCache();
  }

  removeRule(rule: Omit<RuleDefinition<Params>, "successor">) {
    if (!this._rules.has(rule.symbol)) {
      throw new Error(
        `Cannot remove rule for symbol ${rule.symbol}, it was not found!`
      );
    }
    this._rules.delete(rule.symbol);
    this._cache.cleanCache();
  }

  getOutput(
    iteration: number,
    bypassCache = false,
    recalculateAllIterations = false
  ) {
    if (!bypassCache) {
      const cachedOutput = this._cache.requestIteration(iteration);
      if (cachedOutput) {
        return cachedOutput;
      }
    }

    return this.getOutputForIteration(iteration, recalculateAllIterations);
  }

  /**
   * Get a string reprensation of the system definition.
   *
   * Note: This may not work properly if you are using object references and
   * successor functions in your rule set.
   */
  getSerializedSystemDefintion() {
    return JSON.stringify([this._initial, Array.from(this._rules.entries())]);
  }

  /**
   * Set the system definition from a serialized string.
   *
   * Note: This may not work properly if you are using object references and
   * successor functions in your rule set.
   */
  setSystemDefinitionFromSerializedString(input: string) {
    try {
      const [initial, rules] = JSON.parse(input);
      this._initial = initial;
      this._rules = new Map(rules);
    } catch (e) {
      throw new Error("Failed parsing serialized system definition!");
    }
  }

  private getOutputForIteration(n: number, recalculateAllIterations = false) {
    let currIteration = 0;
    let currResult = this._initial;

    if (n === 0) {
      return this._initial;
    }

    if (!recalculateAllIterations) {
      let cacheN = n - 1;
      while (typeof currResult === "undefined" && cacheN > 0) {
        const cachedValue = this._cache.requestIteration(cacheN);
        if (cachedValue) {
          currIteration = cacheN;
          currResult = cachedValue;
        } else {
          cacheN = cacheN - 1;
        }
      }
    }

    while (currIteration < n) {
      currIteration = currIteration + 1;
      currResult = this.applyRules(currResult, currIteration);

      this._cache.setIterationCacheEntry(currIteration, currResult);
    }

    return currResult;
  }

  private applyRules(
    input: SymbolListState<Params>,
    iteration: number,
    parentSymbolState?: SymbolState<Params>
  ) {
    let result = input.map((symbolState) => {
      if (typeof symbolState.branch === "undefined") {
        return symbolState;
      }
      // is branch symbol, perform replacement on the branch symbols first
      return {
        ...symbolState,
        branch: this.applyRules(symbolState.branch, iteration, symbolState),
      };
    });

    this._rules.forEach((def) => {
      result = this.applyRule(result, def, iteration, parentSymbolState);
    });

    return result;
  }

  private applyRule(
    input: SymbolListState<Params>,
    rule: RuleDefinition<Params>,
    iteration: number,
    parentSymbolState?: SymbolState<Params>
  ) {
    return input.reduce<SymbolListState<Params>>(
      (acc, currentSymbolState, currentIndex) => {
        const prevSymbolState = acc[currentIndex - 1];
        const nextSymbolState = acc[currentIndex + 1];

        // Early return if the state was touched within this iteration
        // (previous rule)
        if (currentSymbolState.lastTouched === iteration) {
          return [...acc, currentSymbolState];
        }

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

        return [
          ...acc,
          ...this.applyRuleOnSymbol({
            currentSymbolState,
            iteration,
            rule,
            nextSymbolState,
            prevSymbolState,
            parentSymbolState,
          }),
        ];
      },
      [] as SymbolListState<Params>
    );
  }

  private applyRuleOnSymbol({
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
    if (
      Array.isArray(rule.successor) &&
      typeof (rule.successor as unknown as StochasticSuccessor<Params>)[0]
        .probability !== "undefined"
    ) {
      return this.applyRuleOnSymbol({
        currentSymbolState,
        rule: {
          ...rule,
          successor: randomlySelectValueByProbability(
            rule.successor as unknown as StochasticSuccessor<Params>
          ).successor,
        },
        iteration,
        prevSymbolState,
        nextSymbolState,
        parentSymbolState,
      });
    }

    // FunctionSuccessor
    if (typeof rule.successor === "function") {
      return [
        {
          ...rule.successor({
            currentSymbolState,
            prevSymbolState,
            nextSymbolState,
            parentSymbolState,
          }),
          lastTouched: iteration,
        },
      ];
    }

    // Multiple SymbolState array
    if (Array.isArray(rule.successor)) {
      return (rule.successor as SymbolState<Params>[]).map((s) => ({
        ...s,
        lastTouched: iteration,
      }));
    }

    // Simple single SymbolState object
    if (typeof rule.successor.symbol === "string") {
      return [{ ...rule.successor, lastTouched: iteration }];
    }

    throw new Error(
      "A rule was matched but there was no valid successor defined!"
    );
  }
}
