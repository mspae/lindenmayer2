import { Condition } from "../condition";

export type SymbolListState<Params extends object = {}> = SymbolState<Params>[];

export type SymbolState<Params extends object = {}> = {
  symbol: string;
  params?: Params;
  branch?: SymbolListState<Params>;
  lastTouched?: number;
};

export type RuleDefinition<Params extends object = {}> = {
  id: string;
  condition: Condition<Params>;
  successor: Successor<Params>;
  /** override other rules which were applied in the same iteration */
  allowOverride?: boolean;
};

export type ContextIdentifier = string | string[];

// Successor types
export type StochasticSuccessor<Params extends object = {}> = {
  successor: Successor<Params>;
  probability: number;
}[];

export type FunctionSuccessor<Params extends object = {}> = (context: {
  symbolState: SymbolState<Params>;
  parentSymbolState?: SymbolState<Params>;
  index?: number;
  listState: SymbolListState<Params>;
}) => SymbolState<Params>;

export type Successor<Params extends object = {}> =
  | SymbolState<Params>
  | SymbolState<Params>[]
  | FunctionSuccessor<Params>
  | StochasticSuccessor<Params>;
