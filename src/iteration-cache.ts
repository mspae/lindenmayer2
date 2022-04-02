import { SystemState } from "./utils/state";

export class IterationCache<Params extends object = {}> {
  private _currentSystemHash: number;
  private _cache: Map<string, SystemState<Params>>;

  constructor() {
    this._currentSystemHash = null;
    this._cache = new Map();
  }

  requestIteration(systemHash: number, n: number) {
    if (this._currentSystemHash !== systemHash) {
      return null;
    }
    if (this._cache.has(String(n))) {
      return this._cache.get(String(n));
    }
    return null;
  }

  setIterationCacheEntry(
    systemHash: number,
    n: number,
    entry: SystemState<Params>
  ) {
    if (this._currentSystemHash !== systemHash) {
      this.cleanCache();
    }
    this._currentSystemHash = systemHash;

    this._cache.set(String(n), entry);
  }

  cleanCache() {
    this._cache.clear();
  }
}
