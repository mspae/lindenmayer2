import { matchCondition } from "./condition";
import { IterationCache } from "./iteration-cache";
import { applySuccessorRule } from "./successor";
import { SymbolState, SymbolListState, RuleDefinition } from "./utils/types";

export class LSystem<Params extends object = {}> {
  private _cache: IterationCache<Params>;
  private _rules: Map<string, RuleDefinition<Params>>;
  private _initial: SymbolListState<Params>;
  private _persistStateAfterRuleChanges: boolean;

  constructor({
    rules,
    initial,
    persistStateAfterRuleChanges = false,
  }: {
    initial: SymbolListState<Params>;
    rules?: RuleDefinition<Params>[];
    persistStateAfterRuleChanges?: boolean;
  }) {
    this._persistStateAfterRuleChanges = persistStateAfterRuleChanges;
    this._cache = new IterationCache();
    this._rules = new Map(
      rules ? rules.reduce((acc, rule) => [...acc, [rule.id, rule]], []) : []
    );
    this._initial = initial;
  }

  /**
   * Force a cleaning of the cache.
   */
  public cleanCache() {
    this._cache.cleanCache();
  }

  /**
   * Dynamically add a production rule.
   */
  public addRule(rule: RuleDefinition<Params>) {
    this._rules.set(rule.id, rule);
    if (!this._persistStateAfterRuleChanges) {
      this._cache.cleanCache();
    }
  }

  /**
   * Dynamically remove a production rule by its id.
   */
  public removeRule(id: string) {
    if (!this._rules.has(id)) {
      throw new Error(`Cannot remove rule ${id}, it was not found!`);
    }
    this._rules.delete(id);
    if (!this._persistStateAfterRuleChanges) {
      this._cache.cleanCache();
    }
  }

  /**
   * Get the output for a specified iteration. Optionally force recomputation
   * of this iteration's output and optionally force recomputation of all
   * previous iterations.
   */
  public getOutput(
    iteration: number,
    forceRecomputationOfIteration = false,
    forceRecomputationOfPreviousIterations = false
  ) {
    if (!forceRecomputationOfIteration) {
      const cachedOutput = this._cache.requestIteration(iteration);
      if (cachedOutput) {
        return cachedOutput;
      }
    }

    return this.getOutputForIteration(
      iteration,
      forceRecomputationOfPreviousIterations
    );
  }

  /**
   * Get the result of applying all production rules on an input. Optionally
   * force recomputation of all previous iterations.
   */
  private getOutputForIteration(
    iteration: number,
    forceRecomputationOfPreviousIterations = false
  ) {
    let currIteration = 0;
    let currResult = this._initial;

    if (iteration === 0) {
      return this._initial;
    }

    // attempt to find a previous iteration's state from which to continue
    // calculation. Start at n - 1 and work down to 0.
    if (!forceRecomputationOfPreviousIterations) {
      let cachedIteration = iteration - 1;
      while (typeof currResult === "undefined" && cachedIteration > 0) {
        const cachedValue = this._cache.requestIteration(cachedIteration);
        if (cachedValue) {
          currIteration = cachedIteration;
          currResult = cachedValue;
        } else {
          cachedIteration = cachedIteration - 1;
        }
      }
    }

    // Calculate all missing iterations before n
    while (currIteration < iteration) {
      currIteration = currIteration + 1;
      currResult = this.applyRules(currResult, currIteration);

      this._cache.setIterationCacheEntry(currIteration, currResult);
    }

    return currResult;
  }

  /**
   * Apply all productive rules on an input.
   */
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

  /**
   * Apply a single production rule on an input.
   */
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
