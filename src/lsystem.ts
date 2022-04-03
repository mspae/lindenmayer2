import { IterationCache } from "./iteration-cache";
import { applySuccessorRule } from "./successor";
import { randomlySelectValueByProbability } from "./utils/random";
import { SymbolState, SymbolListState, RuleDefinition } from "./utils/types";


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
          ...applySuccessorRule({
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
}
