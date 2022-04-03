import { SymbolListState } from "./utils/types";

export class IterationCache<Params extends object = {}> {
  private _cache: Map<string, SymbolListState<Params>>;

  constructor() {
    this._cache = new Map();
  }

  requestIteration(n: number): null | SymbolListState<Params> {
    if (this._cache.has(String(n))) {
      return this._cache.get(String(n));
    }
    return null;
  }

  setIterationCacheEntry(n: number, entry: SymbolListState<Params>) {
    this._cache.set(String(n), entry);
  }

  cleanCache() {
    this._cache.clear();
  }
}
