import { LSystem } from "./lsystem";
import { SymbolListState } from "./utils/state";

const symbolListToStr = (state: SymbolListState) =>
  state.reduce((acc, { symbol }) => `${acc}${symbol}`, "");
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
  expect(instance.getOutput(3)).toMatchObject(strToSymbolList("ABAAB"));
  expect(instance.getOutput(4)).toMatchObject(strToSymbolList("ABAABABA"));
  expect(instance.getOutput(5)).toMatchObject(strToSymbolList("ABAABABAABAAB"));
});
