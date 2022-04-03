import { matchCondition } from "./condition";
import { IterationCache } from "./iteration-cache";
import { applySuccessorRule } from "./successor";
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
      rules ? rules.reduce((acc, rule) => [...acc, [rule.id, rule]], []) : []
    );
    this._initial = initial;
    this._cache.cleanCache();
  }

  addRule(rule: RuleDefinition<Params>) {
    this._rules.set(rule.id, rule);
    this._cache.cleanCache();
  }

  removeRule(rule: Pick<RuleDefinition<Params>, "id">) {
    if (!this._rules.has(rule.id)) {
      throw new Error(`Cannot remove rule ${rule.id}, it was not found!`);
    }
    this._rules.delete(rule.id);
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
      (acc, symbolState, index, listState) => {
        // Early return if the state was touched within this iteration
        // (previous rule) and if rule.allowOverride is not set to true
        if (symbolState.lastTouched === iteration && !rule.allowOverride) {
          return [...acc, symbolState];
        }

        if (
          !matchCondition<Params>({
            condition: rule.condition,
            symbolState,
            parentSymbolState,
            listState,
            index,
            iteration,
          })
        ) {
          // Early return if the condition does not match
          return [...acc, symbolState];
        }

        return [
          ...acc,
          ...applySuccessorRule({
            symbolState,
            parentSymbolState,
            listState,
            iteration,
            rule,
            index,
          }),
        ];
      },
      [] as SymbolListState<Params>
    );
  }
}
