import { SymbolListState, SymbolState } from "./utils/types";

export type ConditionContext<T extends object = {}> = {
  condition?: Condition<T>;
  symbolState: SymbolState<T>;
  parentSymbolState?: SymbolState<T>;
  listState: SymbolListState<T>;
  index: number;
  iteration: number;
};
export type Condition<T extends object = {}> = (
  context: ConditionContext<T>
) => boolean;

export const and =
  <T extends object = {}>(...conditions: Condition<T>[]) =>
  (ctx: ConditionContext<T>) =>
    conditions.every((condition) => condition(ctx));

export const or =
  <T extends object = {}>(...conditions: Condition<T>[]) =>
  (ctx: ConditionContext<T>) =>
    conditions.some((condition) => condition(ctx));

export const not =
  <T extends object = {}>(condition: Condition<T>) =>
  (ctx: ConditionContext<T>) =>
    !condition(ctx);

export const matchSymbol =
  <T extends object = {}>(symbols: unknown | unknown[]) =>
  (ctx: ConditionContext<T>) => {
    if (Array.isArray(symbols)) {
      return symbols.includes(ctx.symbolState.symbol);
    }
    return symbols === ctx.symbolState.symbol;
  };

export const after =
  <T extends object = {}>(condition: Condition<T>) =>
  (ctx: ConditionContext<T>) => {
    if (ctx.index === 0) {
      return false;
    }
    const previousIndex = ctx.index - 1;
    const previousSymbol = ctx.listState[previousIndex];
    condition({
      ...ctx,
      condition,
      index: previousIndex,
      symbolState: previousSymbol,
    });
  };

export const afterAny =
  <T extends object = {}>(condition: Condition<T>) =>
  (ctx: ConditionContext<T>) => {
    if (ctx.index === 0) {
      return false;
    }
    const previousSymbols = ctx.listState.slice(0, ctx.index);
    return previousSymbols.some((prevSymbol, index) =>
      condition({
        ...ctx,
        condition,
        index,
        symbolState: prevSymbol,
      })
    );
  };

export const afterAll =
  <T extends object = {}>(condition: Condition<T>) =>
  (ctx: ConditionContext<T>) => {
    if (ctx.index === 0) {
      return false;
    }
    const previousSymbols = ctx.listState.slice(0, ctx.index);
    return previousSymbols.every((prevSymbol, index) =>
      condition({
        ...ctx,
        condition,
        index,
        symbolState: prevSymbol,
      })
    );
  };

export const before =
  <T extends object = {}>(condition: Condition<T>) =>
  (ctx: ConditionContext<T>) => {
    if (ctx.index === ctx.listState.length - 1) {
      return false;
    }
    const nextIndex = ctx.index + 1;
    const nextSymbol = ctx.listState[nextIndex];
    condition({
      ...ctx,
      condition,
      index: nextIndex,
      symbolState: nextSymbol,
    });
  };

export const beforeAny =
  <T extends object = {}>(condition: Condition<T>) =>
  (ctx: ConditionContext<T>) => {
    if (ctx.index === ctx.listState.length - 1) {
      return false;
    }
    const nextSymbols = ctx.listState.slice(ctx.index + 1);
    return nextSymbols.some((nextSymbol, index) =>
      condition({
        ...ctx,
        condition,
        index,
        symbolState: nextSymbol,
      })
    );
  };

export const beforeAll =
  <T extends object = {}>(condition: Condition<T>) =>
  (ctx: ConditionContext<T>) => {
    if (ctx.index === ctx.listState.length - 1) {
      return false;
    }
    const nextSymbols = ctx.listState.slice(ctx.index + 1);
    return nextSymbols.every((nextSymbol, index) =>
      condition({
        ...ctx,
        condition,
        index,
        symbolState: nextSymbol,
      })
    );
  };

export const relativeTo =
  <T extends object = {}>(relativeIndex: number, condition: Condition<T>) =>
  (ctx: ConditionContext<T>) => {
    const absoluteIndex = ctx.index + relativeIndex;
    // Prevent out-of-bounds absolute index
    if (absoluteIndex < 0 || absoluteIndex > ctx.listState.length - 1) {
      return false;
    }
    const symbolToCompare = ctx.listState[absoluteIndex];
    return condition({
      ...ctx,
      index: absoluteIndex,
      symbolState: symbolToCompare,
      condition,
    });
  };

export const matchCondition = <T extends object = {}>(context: {
  condition: Condition<T>;
  symbolState: SymbolState<T>;
  parentSymbolState?: SymbolState<T>;
  listState: SymbolListState<T>;
  index: number;
  iteration: number;
}) => {
  const { condition } = context;

  return condition(context);
};
