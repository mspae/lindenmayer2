import { randomlySelectValueByProbability } from "./utils/random";
import {
  RuleDefinition,
  StochasticSuccessor,
  SymbolListState,
  SymbolState,
} from "./utils/types";

export const applySuccessorRule = <Params extends object = {}>({
  symbolState,
  rule,
  iteration,
  parentSymbolState,
  listState,
  index,
}: {
  symbolState: SymbolState<Params>;
  parentSymbolState?: SymbolState<Params>;
  listState: SymbolListState<Params>;
  index: number;
  rule: RuleDefinition<Params>;
  iteration: number;
}): SymbolListState<Params> => {
  // FunctionSuccessor
  if (typeof rule.successor === "function") {
    return [
      {
        ...rule.successor({
          symbolState,
          parentSymbolState,
          listState,
          index,
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
        symbolState,
        rule: {
          ...rule,
          successor: randomlySelectedValue.successor,
        },
        iteration,
        parentSymbolState,
        listState,
        index,
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
