import {
  afterAny,
  afterAll,
  and,
  beforeAny,
  matchCondition,
  matchSymbol,
  not,
  or,
  relativeTo,
  beforeAll,
  Condition,
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
  const conditionFn: Condition<{ lol?: number }> = ({ symbolState }) =>
    typeof symbolState.params?.lol !== "undefined";
  const matchedSymbols = input.filter((symbolState, index) =>
    matchCondition({
      condition: conditionFn,
      index: index,
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

test("matching with a beforeAny condition", () => {
  const input = [{ symbol: "A" }, { symbol: "B" }, { symbol: "C" }];

  const matchedSymbols = input.filter((symbolState, index) =>
    matchCondition({
      condition: beforeAny(matchSymbol("B")),
      index,
      symbolState,
      iteration: 1,
      listState: input,
    })
  );

  const notMatchedSymbols = input.filter((symbolState, index) =>
    matchCondition({
      condition: beforeAny(matchSymbol("A")),
      index,
      symbolState,
      iteration: 1,
      listState: input,
    })
  );

  expect(notMatchedSymbols).toHaveLength(0);
  expect(matchedSymbols).toHaveLength(1);
  expect(matchedSymbols[0]).toMatchObject(input[0]);
});

test("matching with an afterAny condition", () => {
  const input = [{ symbol: "A" }, { symbol: "B" }, { symbol: "C" }];

  const matchedSymbols = input.filter((symbolState, index) =>
    matchCondition({
      condition: afterAny(matchSymbol("B")),
      index,
      symbolState,
      iteration: 1,
      listState: input,
    })
  );
  const notMatchedSymbols = input.filter((symbolState, index) =>
    matchCondition({
      condition: afterAny(matchSymbol("C")),
      index,
      symbolState,
      iteration: 1,
      listState: input,
    })
  );

  expect(notMatchedSymbols).toHaveLength(0);
  expect(matchedSymbols).toHaveLength(1);
  expect(matchedSymbols[0]).toMatchObject(input[2]);
});

test("matching with a beforeAll condition", () => {
  const input = [
    { symbol: "C" },
    { symbol: "A" },
    { symbol: "B" },
    { symbol: "B" },
  ];

  const matchedSymbols = input.filter((symbolState, index) =>
    matchCondition({
      condition: beforeAll(matchSymbol("B")),
      index,
      symbolState,
      iteration: 1,
      listState: input,
    })
  );

  const notMatchedSymbols = input.filter((symbolState, index) =>
    matchCondition({
      condition: beforeAll(matchSymbol("A")),
      index,
      symbolState,
      iteration: 1,
      listState: input,
    })
  );

  expect(notMatchedSymbols).toHaveLength(0);
  expect(matchedSymbols).toHaveLength(2);
  expect(matchedSymbols[0]).toMatchObject(input[1]);
  expect(matchedSymbols[1]).toMatchObject(input[2]);
});

test.only("matching with an afterAll condition", () => {
  const input = [
    { symbol: "B" },
    { symbol: "B" },
    { symbol: "A" },
    { symbol: "C" },
  ];

  const matchedSymbols = input.filter((symbolState, index) =>
    matchCondition({
      condition: afterAll(matchSymbol("B")),
      index,
      symbolState,
      iteration: 1,
      listState: input,
    })
  );

  const notMatchedSymbols = input.filter((symbolState, index) =>
    matchCondition({
      condition: afterAll(matchSymbol("A")),
      index,
      symbolState,
      iteration: 1,
      listState: input,
    })
  );

  expect(notMatchedSymbols).toHaveLength(0);
  expect(matchedSymbols).toHaveLength(2);
  expect(matchedSymbols[0]).toMatchObject(input[1]);
  expect(matchedSymbols[1]).toMatchObject(input[2]);
});

test("matching with an and group condition", () => {
  const input = [
    { symbol: "A", params: { flag: 1 } },
    { symbol: "B" },
    { symbol: "A" },
    { symbol: "C" },
  ];
  const conditionFn: Condition<{ flag: number }> = ({ symbolState }) =>
    symbolState.params?.flag === 1;

  const matchedSymbols = input.filter((symbolState, index) =>
    matchCondition({
      condition: and(matchSymbol("A"), conditionFn),
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
  const conditionFn: Condition<{ flag: number }> = ({ symbolState }) =>
    symbolState.params?.flag === 1;

  const matchedSymbols = input.filter((symbolState, index) =>
    matchCondition({
      condition: or(matchSymbol("C"), conditionFn),
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
