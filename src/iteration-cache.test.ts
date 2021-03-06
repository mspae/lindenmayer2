import { IterationCache } from "./iteration-cache";

test("iteration cache entry and retrieval", () => {
  const cache = new IterationCache();
  const iterationState1 = [{ symbol: "bar", params: {} }];
  const iterationState2 = [{ symbol: "baz", params: { foo: 1 } }];
  cache.setIterationCacheEntry(1, iterationState1);
  cache.setIterationCacheEntry(2, iterationState2);
  cache.setIterationCacheEntry(1, iterationState2);
  cache.setIterationCacheEntry(1, iterationState1);
  const cachedIteration = cache.requestIteration(1);
  expect(cachedIteration).toMatchObject(iterationState1);
});

test("iteration cache cleaning", () => {
  const cache = new IterationCache();
  const iterationState = [{ symbol: "bar", params: {} }];
  cache.setIterationCacheEntry(1, iterationState);
  cache.cleanCache();
  const cachedIteration = cache.requestIteration(1);
  expect(cachedIteration).toBeNull();
});
