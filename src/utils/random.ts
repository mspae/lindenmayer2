export const randomlySelectValueByProbability = <
  T extends {
    probability: number;
  }
>(
  values: T[]
) => {
  let randomNumber = Math.random();
  let selectedValue: T;
  let i = randomIndexOfArray(values.length);
  while (typeof selectedValue === "undefined") {
    // reached the end of the array, start from the beginning
    if (i > values.length) {
      i = 0;
      randomNumber = randomIndexOfArray(values.length);
      continue;
    }

    if (randomNumber < values[i].probability) {
      selectedValue = values[i];
    }
  }

  return selectedValue;
};

const randomIndexOfArray = (len: number) => Math.floor(Math.random() * len);
