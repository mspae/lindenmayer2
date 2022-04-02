export type SymbolListState<Params extends object = {}> = SymbolState<Params>[];

export type SymbolState<Params extends object = {}> = {
  symbol: string;
  params?: Params;
  branch?: SymbolListState<Params>;
  lastTouched?: number;
};
