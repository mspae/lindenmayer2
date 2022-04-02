export type SystemState<Params extends object = {}> = SymbolState<Params>[];

export type SymbolState<Params extends object = {}> = {
  symbol: string;
  params: Params;
  branch?: SystemState<Params>;
};
