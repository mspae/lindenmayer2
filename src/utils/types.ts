export type SymbolListState<Params extends object = {}> = SymbolState<Params>[];

export type SymbolState<Params extends object = {}> = {
  symbol: string;
  params?: Params;
  branch?: SymbolListState<Params>;
  lastTouched?: number;
};

export type RuleDefinition<Params extends object = {}> = {
  symbol: string;
  /** match only if the previous Symbol equaled prevSymbol (string) or if the
   * previous symbol was one of prevSymbol (string[]) */
  prevSymbol?: ContextIdentifier;
  /** match only if the next Symbol equaled nextSymbol (string) or if the next
   * symbol was one of nextSymbol (string[]) */
  nextSymbol?: ContextIdentifier;
  successor: Successor<Params>;
};

export type ContextIdentifier = string | string[];

// Successor types
export type StochasticSuccessor<Params extends object = {}> = {
  successor: Successor<Params>;
  probability: number;
}[];

export type FunctionSuccessor<Params extends object = {}> = (context: {
  currentSymbolState: SymbolState<Params>;
  parentSymbolState?: SymbolState<Params>;
  prevSymbolState?: SymbolState<Params>;
  nextSymbolState?: SymbolState<Params>;
}) => SymbolState<Params>;

export type Successor<Params extends object = {}> =
  | SymbolState<Params>
  | SymbolState<Params>[]
  | FunctionSuccessor<Params>
  | StochasticSuccessor<Params>;
