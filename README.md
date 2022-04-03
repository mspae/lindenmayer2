# Lindenmayer2

> Stochastic, Parametric and context-sensitive l-systems with complex symbols.

This lindenmayer-system implementation is not driven by a text-based
representation (and manipulation) of state and therefore systems are not
limited by needing to be text-encodable. Symbol parameters can be instances of
classes for example.

The drawback of this approach is that the production rules and outputs are of
course not so easily to read as a simple text representation of state.

## Example

```javascript
import { LSystem, matchSymbol } from "lindenmayer2";

const system = new LSystem({
  initial: [{ symbol: "A" }],
  rules: [
    {
      id: "A",
      condition: matchSymbol("A"),
      successor: [
        {
          symbol: "A",
        },
        {
          symbol: "B",
        },
      ],
    },
    {
      id: "B",
      condition: matchSymbol("B"),
      successor: [
        {
          symbol: "A",
        },
      ],
    },
  ],
});

const tenthIteration = system.getOutput(10);
```

## Credits

- Inspired by the project `lindenmayer` by [nylki](https://github.com/nylki/lindenmayer)
