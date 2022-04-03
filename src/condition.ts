import { SymbolListState, SymbolState } from "./utils/types";

type MatchSymbolCondition = {
  type: "match_symbol";
  symbol: string | string[];
};
export const matchSymbol = (symbol: string): MatchSymbolCondition => ({
  type: "match_symbol",
  symbol,
});

type MatchCallbackCondition<Params extends object = {}> = {
  type: "match_callback";
  callback: (context: {
    symbolState: SymbolState<Params>;
    parentSymbolState?: SymbolState<Params>;
    listState: SymbolListState<Params>;
    index: number;
    iteration: number;
  }) => boolean;
};
export const matchCallback = <Params extends object = {}>(
  callback: MatchCallbackCondition<Params>["callback"]
): MatchCallbackCondition<Params> => ({
  type: "match_callback",
  callback,
});

type RelativeToCondition<Params extends object = {}> = {
  type: "relative_to";
  relativeIndex: number;
  condition: Condition<Params>;
};
export const relativeTo = <Params extends object = {}>(
  relativeIndex: number,
  condition: Condition<Params>
): RelativeToCondition<Params> => ({
  type: "relative_to",
  relativeIndex,
  condition,
});

type BeforeCondition<Params extends object = {}> = {
  type: "before";
  condition: Condition<Params>;
};
export const before = <Params extends object = {}>(
  condition: Condition<Params>
): BeforeCondition<Params> => ({
  type: "before",
  condition,
});

type AfterCondition<Params extends object = {}> = {
  type: "after";
  condition: Condition<Params>;
};
export const after = <Params extends object = {}>(
  condition: Condition<Params>
): AfterCondition<Params> => ({
  type: "after",
  condition,
});

type NotCondition<Params extends object = {}> = {
  type: "not";
  condition: Condition<Params>;
};
export const not = <Params extends object = {}>(
  condition: Condition<Params>
): NotCondition<Params> => ({
  type: "not",
  condition,
});

type OrGroupCondition<Params extends object = {}> = {
  type: "or_group";
  conditions: Condition<Params>[];
};
export const or = <Params extends object = {}>(
  ...conditions: Condition<Params>[]
): OrGroupCondition<Params> => ({
  type: "or_group",
  conditions,
});

type AndGroupCondition<Params extends object = {}> = {
  type: "and_group";
  conditions: Condition<Params>[];
};
export const and = <Params extends object = {}>(
  ...conditions: Condition<Params>[]
): AndGroupCondition<Params> => ({
  type: "and_group",
  conditions,
});

export type Condition<Params extends object = {}> =
  | MatchSymbolCondition
  | MatchCallbackCondition<Params>
  | BeforeCondition<Params>
  | AfterCondition<Params>
  | RelativeToCondition<Params>
  | NotCondition<Params>
  | OrGroupCondition<Params>
  | AndGroupCondition<Params>;

export const matchCondition = <Params extends object = {}>(context: {
  condition: Condition<Params>;
  symbolState: SymbolState<Params>;
  parentSymbolState?: SymbolState<Params>;
  listState: SymbolListState<Params>;
  index: number;
  iteration: number;
}) => {
  const { condition, symbolState, listState, index } = context;
  if (condition.type === "not") {
    return !matchCondition({ ...context, condition: condition.condition });
  }
  if (condition.type === "and_group") {
    return condition.conditions.every((condition) =>
      matchCondition({ ...context, condition })
    );
  }
  if (condition.type === "or_group") {
    return condition.conditions.some((condition) =>
      matchCondition({ ...context, condition })
    );
  }
  if (condition.type === "match_callback") {
    return condition.callback(context);
  }
  if (condition.type === "match_symbol") {
    if (Array.isArray(condition.symbol)) {
      return condition.symbol.includes(symbolState.symbol);
    }
    return condition.symbol === symbolState.symbol;
  }
  if (condition.type === "after") {
    if (index === 0) {
      return false;
    }
    const previousSymbols = listState.slice(0, index);
    return previousSymbols.some((prevSymbol, index) =>
      matchCondition({
        ...context,
        condition: condition.condition,
        index,
        symbolState: prevSymbol,
      })
    );
  }
  if (condition.type === "before") {
    if (index === listState.length - 1) {
      return false;
    }
    const nextSymbols = listState.slice(index + 1);
    return nextSymbols.some((prevSymbol, afterIndex) =>
      matchCondition({
        ...context,
        condition: condition.condition,
        index: index + afterIndex,
        symbolState: prevSymbol,
      })
    );
  }
  if (condition.type === "relative_to") {
    const absoluteIndex = index + condition.relativeIndex;
    // Prevent out-of-bounds absolute index
    if (absoluteIndex < 0 || absoluteIndex > listState.length - 1) {
      return false;
    }
    const symbolToCompare = listState[absoluteIndex];
    return matchCondition({
      ...context,
      index: absoluteIndex,
      symbolState: symbolToCompare,
      condition: condition.condition,
    });
  }
};
