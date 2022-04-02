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
    if (i > values.length - 1) {
      i = randomIndexOfArray(values.length);
      randomNumber = Math.random();
      continue;
    }
    if (randomNumber < values[i].probability) {
      selectedValue = values[i];
      break;
    }

    i++;
  }

  return selectedValue;
};

const randomIndexOfArray = (len: number) => Math.floor(Math.random() * len);
