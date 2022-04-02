export const hash = (input: string) => {
  var hash = 0,
    i,
    chr;
  if (input.length === 0) return hash;
  for (i = 0; i < input.length; i++) {
    chr = input.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash;
};
