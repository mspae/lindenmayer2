import { and, matchSymbol, relativeTo } from "./condition";
import { LSystem } from "./lsystem";
import { SymbolListState } from "./utils/types";

// NOTE: These two functions dont cleanly talk to each other.
const symbolListToStr = (state: SymbolListState) =>
  state.reduce(
    (acc, { symbol, branch }) =>
      `${acc}${symbol}${branch ? "[" + symbolListToStr(branch) + "]" : ""}`,
    ""
  );
const strToSymbolList = (input: string) =>
  input.split("").map((symbol) => ({ symbol }));

test("simple usage", () => {
  const instance = new LSystem({
    initial: strToSymbolList("A"),
    rules: [
      {
        id: "A",
        condition: matchSymbol("A"),
        successor: strToSymbolList("AB"),
      },
      {
        id: "B",
        condition: matchSymbol("B"),
        successor: {
          symbol: "A",
        },
      },
    ],
  });

  expect(instance.getOutput(1)).toMatchObject(strToSymbolList("AB"));
  expect(instance.getOutput(2)).toMatchObject(strToSymbolList("ABA"));
  expect(instance.getOutput(3)).toMatchObject(strToSymbolList("ABAAB"));
  expect(instance.getOutput(4)).toMatchObject(strToSymbolList("ABAABABA"));
  expect(instance.getOutput(5)).toMatchObject(strToSymbolList("ABAABABAABAAB"));
  expect(instance.getOutput(4)).toMatchObject(strToSymbolList("ABAABABA"));
  expect(instance.getOutput(2)).toMatchObject(strToSymbolList("ABA"));
});

test("dynamic rule management", () => {
  const instance = new LSystem({
    initial: strToSymbolList("A"),
    rules: [],
  });

  instance.addRule({
    id: "A",
    condition: matchSymbol("A"),
    successor: strToSymbolList("ABZA"),
  });
  instance.addRule({
    id: "A",
    condition: matchSymbol("A"),
    successor: strToSymbolList("AB"),
  });
  instance.addRule({
    id: "B",
    condition: matchSymbol("B"),
    successor: {
      symbol: "A",
    },
  });
  instance.removeRule("B");

  expect(instance.getOutput(1)).toMatchObject(strToSymbolList("AB"));
  expect(instance.getOutput(2)).toMatchObject(strToSymbolList("ABB"));
  expect(instance.getOutput(3)).toMatchObject(strToSymbolList("ABBB"));
  expect(instance.getOutput(4)).toMatchObject(strToSymbolList("ABBBB"));
});

test("system definition serialization", () => {
  const instance = new LSystem({
    initial: strToSymbolList("A"),
    rules: [
      {
        id: "A",
        condition: matchSymbol("A"),
        successor: strToSymbolList("AB"),
      },
      {
        id: "B",
        condition: matchSymbol("B"),
        successor: {
          symbol: "A",
        },
      },
    ],
  });

  expect(instance.getSerializedSystemDefintion()).toEqual(
    '[[{"symbol":"A"}],[["A",{"id":"A","condition":{"type":"match_symbol","symbol":"A"},"successor":[{"symbol":"A"},{"symbol":"B"}]}],["B",{"id":"B","condition":{"type":"match_symbol","symbol":"B"},"successor":{"symbol":"A"}}]]]'
  );

  instance.setSystemDefinitionFromSerializedString(
    JSON.stringify([
      strToSymbolList("BB"),
      [
        [
          "B",
          {
            id: "B",
            condition: matchSymbol("B"),
            successor: strToSymbolList("C"),
          },
        ],
        [
          "A",
          {
            id: "A",
            condition: matchSymbol("A"),
            successor: strToSymbolList("AAB"),
          },
        ],
      ],
    ])
  );
  expect(instance.getSerializedSystemDefintion()).toEqual(
    '[[{"symbol":"B"},{"symbol":"B"}],[["B",{"id":"B","condition":{"type":"match_symbol","symbol":"B"},"successor":[{"symbol":"C"}]}],["A",{"id":"A","condition":{"type":"match_symbol","symbol":"A"},"successor":[{"symbol":"A"},{"symbol":"A"},{"symbol":"B"}]}]]]'
  );
});

test("successor functions (single symbol return)", () => {
  const instance = new LSystem({
    initial: strToSymbolList("A"),
    rules: [
      {
        id: "A",
        condition: matchSymbol("A"),
        successor: strToSymbolList("AB"),
      },
      {
        id: "B",
        condition: matchSymbol("B"),
        successor: (args) => ({
          symbol: "BA",
          params: { foo: 1 },
        }),
      },
    ],
  });

  expect(instance.getOutput(5)).toMatchObject([
    { lastTouched: 5, symbol: "A" },
    { lastTouched: 5, symbol: "B" },
    { lastTouched: 5, params: { foo: 1 }, symbol: "BA" },
    { lastTouched: 4, params: { foo: 1 }, symbol: "BA" },
    { lastTouched: 3, params: { foo: 1 }, symbol: "BA" },
    { lastTouched: 2, params: { foo: 1 }, symbol: "BA" },
  ]);
});

test("successor functions (symbol array return)", () => {
  const instance = new LSystem({
    initial: strToSymbolList("A"),
    rules: [
      {
        id: "A",
        condition: matchSymbol("A"),
        successor: strToSymbolList("AB"),
      },
      {
        id: "B",
        condition: matchSymbol("B"),
        successor: (args) => [
          {
            symbol: "BA",
            params: { foo: 1 },
          },
          {
            symbol: "C",
          },
        ],
      },
    ],
  });

  expect(instance.getOutput(5)).toMatchObject([
    { lastTouched: 5, symbol: "A" },
    { lastTouched: 5, symbol: "B" },
    { lastTouched: 5, params: { foo: 1 }, symbol: "BA" },
    { lastTouched: 5, symbol: "C" },
    { lastTouched: 4, params: { foo: 1 }, symbol: "BA" },
    { lastTouched: 4, symbol: "C" },
    { lastTouched: 3, params: { foo: 1 }, symbol: "BA" },
    { lastTouched: 3, symbol: "C" },
    { lastTouched: 2, params: { foo: 1 }, symbol: "BA" },
    { lastTouched: 2, symbol: "C" },
  ]);
});

test("context-aware successor definitions", () => {
  const instance = new LSystem({
    initial: strToSymbolList("ABCAB"),
    rules: [
      {
        id: "A",
        condition: matchSymbol("A"),
        successor: strToSymbolList("CAB"),
      },
      {
        id: "B",
        condition: and(matchSymbol("B"), relativeTo(-1, matchSymbol("A"))),
        successor: strToSymbolList("_"),
        allowOverride: true,
      },
    ],
  });
  expect(symbolListToStr(instance.getOutput(1))).toEqual("CA_BCCA_B");
});

test("stochastic successor definitions", () => {
  const instance = new LSystem({
    initial: strToSymbolList("A"),
    rules: [
      {
        id: "A",
        condition: matchSymbol("A"),
        successor: [
          {
            successor: strToSymbolList("A1"),
            probability: 0.2,
          },
          {
            successor: strToSymbolList("A2"),
            probability: 0.8,
          },
        ],
      },
    ],
  });
  const firstResult = symbolListToStr(instance.getOutput(40));
  const secondResult = symbolListToStr(instance.getOutput(40, true, true));
  expect(firstResult).not.toEqual(secondResult);
});

test("branch definitions", () => {
  const instance = new LSystem({
    initial: strToSymbolList("A"),
    rules: [
      {
        id: "A",
        condition: matchSymbol("A"),
        successor: {
          symbol: "B",
          branch: [
            {
              symbol: "A",
            },
            {
              symbol: "C",
            },
          ],
        },
      },
      {
        id: "C",
        condition: matchSymbol("C"),
        successor: strToSymbolList("ZCAB"),
      },
    ],
  });
  const firstResult = symbolListToStr(instance.getOutput(3));
  expect(firstResult).toEqual("B[B[B[AC]ZCAB]ZZCABB[AC]B]");
});
