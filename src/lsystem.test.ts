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
        symbol: "A",
        successor: strToSymbolList("AB"),
      },
      {
        symbol: "B",
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
    symbol: "A",
    successor: strToSymbolList("ABZA"),
  });
  instance.addRule({
    symbol: "A",
    successor: strToSymbolList("AB"),
  });
  instance.addRule({
    symbol: "B",
    successor: {
      symbol: "A",
    },
  });
  instance.removeRule({ symbol: "B" });

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
        symbol: "A",
        successor: strToSymbolList("AB"),
      },
      {
        symbol: "B",
        successor: {
          symbol: "A",
        },
      },
    ],
  });

  expect(instance.getSerializedSystemDefintion()).toEqual(
    '[[{"symbol":"A"}],[["A",{"symbol":"A","successor":[{"symbol":"A"},{"symbol":"B"}]}],["B",{"symbol":"B","successor":{"symbol":"A"}}]]]'
  );

  instance.setSystemDefinitionFromSerializedString(
    JSON.stringify([
      strToSymbolList("BB"),
      [
        ["B", { symbol: "B", successor: "BA" }],
        ["A", { symbol: "A", successor: strToSymbolList("AAB") }],
      ],
    ])
  );
  expect(instance.getSerializedSystemDefintion()).toEqual(
    '[[{"symbol":"B"},{"symbol":"B"}],[["B",{"symbol":"B","successor":"BA"}],["A",{"symbol":"A","successor":[{"symbol":"A"},{"symbol":"A"},{"symbol":"B"}]}]]]'
  );
});

test("successor functions", () => {
  const instance = new LSystem({
    initial: strToSymbolList("A"),
    rules: [
      {
        symbol: "A",
        successor: strToSymbolList("AB"),
      },
      {
        symbol: "B",
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

test("context-aware successor definitions", () => {
  const instance = new LSystem({
    initial: strToSymbolList("A"),
    rules: [
      {
        symbol: "A",
        successor: strToSymbolList("CAB"),
      },
      {
        symbol: "B",
        successor: strToSymbolList("ACBBC"),
        prevSymbol: "A",
      },
      {
        symbol: "C",
        nextSymbol: "B",
        successor: strToSymbolList("AB"),
      },
    ],
  });
  expect(symbolListToStr(instance.getOutput(4))).toEqual("ABCABBBCABBABCABBBB");
});

test("stochastic successor definitions", () => {
  const instance = new LSystem({
    initial: strToSymbolList("A"),
    rules: [
      {
        symbol: "A",
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

test.only("branch definitions", () => {
  const instance = new LSystem({
    initial: strToSymbolList("A"),
    rules: [
      {
        symbol: "A",
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
        symbol: "C",
        successor: strToSymbolList("ZCAB"),
      },
    ],
  });
  const firstResult = symbolListToStr(instance.getOutput(3));
  expect(firstResult).toEqual("B[B[B[AC]ZCAB]ZZCABB[AC]B]");
});
