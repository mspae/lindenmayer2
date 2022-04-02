import { randomlySelectValueByProbability } from "./random";

test("randomlySelectValueByProbability should work", () => {
  expect(
    randomlySelectValueByProbability([
      {
        name: "impossible",
        probability: 0,
      },
      {
        name: "inevitable",
        probability: 1,
      },
    ])
  ).toMatchObject({
    name: "inevitable",
    probability: 1,
  });
});
