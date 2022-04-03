import {
  after,
  and,
  before,
  matchCallback,
  matchCondition,
  matchSymbol,
  not,
  or,
  relativeTo,
} from "./condition";

test("matching with a simple symbol matcher", () => {
  const input = [{ symbol: "A" }, { symbol: "B" }];

  const matchedSymbols = input.filter((symbolState, index) =>
    matchCondition({
      condition: matchSymbol("B"),
      index,
      symbolState,
      iteration: 1,
      listState: input,
    })
  );

  expect(matchedSymbols).toHaveLength(1);
  expect(matchedSymbols[0]).toMatchObject(input[1]);
});

test("matching with a callback function", () => {
  const input = [{ symbol: "A", params: { lol: 1 } }, { symbol: "B" }];

  const matchedSymbols = input.filter((symbolState, index) =>
    matchCondition({
      condition: matchCallback<{ lol?: number }>(
        ({ symbolState }) => typeof symbolState.params?.lol !== "undefined"
      ),
      index,
      symbolState,
      iteration: 1,
      listState: input,
    })
  );

  expect(matchedSymbols).toHaveLength(1);
  expect(matchedSymbols[0]).toMatchObject(input[0]);
});

test("matching with a not condition", () => {
  const input = [{ symbol: "A" }, { symbol: "B" }];

  const matchedSymbols = input.filter((symbolState, index) =>
    matchCondition({
      condition: not(matchSymbol("B")),
      index,
      symbolState,
      iteration: 1,
      listState: input,
    })
  );

  expect(matchedSymbols).toHaveLength(1);
  expect(matchedSymbols[0]).toMatchObject(input[0]);
});

test("matching with a relativeTo condition", () => {
  const input = [{ symbol: "A" }, { symbol: "B" }, { symbol: "C" }];

  const matchedSymbols = input.filter((symbolState, index) =>
    matchCondition({
      condition: relativeTo(-1, matchSymbol("A")),
      index,
      symbolState,
      iteration: 1,
      listState: input,
    })
  );

  expect(matchedSymbols).toHaveLength(1);
  expect(matchedSymbols[0]).toMatchObject(input[1]);
});

test("matching with a before condition", () => {
  const input = [{ symbol: "A" }, { symbol: "B" }, { symbol: "C" }];

  const matchedSymbols = input.filter((symbolState, index) =>
    matchCondition({
      condition: before(matchSymbol("B")),
      index,
      symbolState,
      iteration: 1,
      listState: input,
    })
  );

  expect(matchedSymbols).toHaveLength(1);
  expect(matchedSymbols[0]).toMatchObject(input[0]);
});

test("matching with an after condition", () => {
  const input = [{ symbol: "A" }, { symbol: "B" }, { symbol: "C" }];

  const matchedSymbols = input.filter((symbolState, index) =>
    matchCondition({
      condition: after(matchSymbol("B")),
      index,
      symbolState,
      iteration: 1,
      listState: input,
    })
  );

  expect(matchedSymbols).toHaveLength(1);
  expect(matchedSymbols[0]).toMatchObject(input[2]);
});

test("matching with an and group condition", () => {
  const input = [
    { symbol: "A", params: { flag: 1 } },
    { symbol: "B" },
    { symbol: "A" },
    { symbol: "C" },
  ];

  const matchedSymbols = input.filter((symbolState, index) =>
    matchCondition({
      condition: and(
        matchSymbol("A"),
        matchCallback<{ flag: number }>(
          ({ symbolState }) => symbolState.params?.flag === 1
        )
      ),
      index,
      symbolState,
      iteration: 1,
      listState: input,
    })
  );

  expect(matchedSymbols).toHaveLength(1);
  expect(matchedSymbols[0].params.flag).toEqual(1);
});

test("matching with an or group condition", () => {
  const input = [
    { symbol: "A", params: { flag: 1 } },
    { symbol: "B" },
    { symbol: "A" },
    { symbol: "C" },
  ];

  const matchedSymbols = input.filter((symbolState, index) =>
    matchCondition({
      condition: or(
        matchSymbol("C"),
        matchCallback<{ flag: number }>(
          ({ symbolState }) => symbolState.params?.flag === 1
        )
      ),
      index,
      symbolState,
      iteration: 1,
      listState: input,
    })
  );

  expect(matchedSymbols).toHaveLength(2);
  expect(matchedSymbols[0].params.flag).toEqual(1);
  expect(matchedSymbols[1]).toMatchObject(input[3]);
});
