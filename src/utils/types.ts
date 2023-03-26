import { Condition } from "../condition";

export type SymbolListState<T extends object = {}> = SymbolState<T>[];

export type SymbolState<T extends object = {}> = {
  symbol: string;
  params?: T;
  branch?: SymbolListState<T>;
  lastTouched?: number;
};

export type RuleDefinition<T extends object = {}> = {
  id: string;
  condition: Condition<T>;
  successor: Successor<T>;
  /** override other rules which were applied in the same iteration */
  allowOverride?: boolean;
};

// Successor types
export type StochasticSuccessor<T extends object = {}> = {
  successor: Successor<T>;
  probability: number;
}[];

export type FunctionSuccessor<T extends object = {}> = (context: {
  symbolState: SymbolState<T>;
  parentSymbolState?: SymbolState<T>;
  parentSymbolIndex?: number;
  index?: number;
  listState: SymbolListState<T>;
}) => SymbolState<T> | SymbolState<T>[];

export type Successor<T extends object = {}> =
  | SymbolState<T>
  | SymbolState<T>[]
  | FunctionSuccessor<T>
  | StochasticSuccessor<T>;
