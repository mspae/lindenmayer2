import { randomlySelectValueByProbability } from "./utils/random";
import {
  RuleDefinition,
  StochasticSuccessor,
  SymbolState,
  SymbolListState,
} from "./utils/types";

export const applySuccessorRule = <Params extends object = {}>({
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
}): SymbolListState<Params> => {
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

  if (Array.isArray(rule.successor)) {
    // StochasticSuccessor
    if (
      typeof (rule.successor as unknown as StochasticSuccessor<Params>)[0]
        .probability !== "undefined"
    ) {
      const randomlySelectedValue = randomlySelectValueByProbability(
        rule.successor as unknown as StochasticSuccessor<Params>
      );
      return applySuccessorRule({
        currentSymbolState,
        rule: {
          ...rule,
          successor: randomlySelectedValue.successor,
        },
        iteration,
        prevSymbolState,
        nextSymbolState,
        parentSymbolState,
      });
    }

    // Multiple SymbolState array
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
};
