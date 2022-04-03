export const LSystemWorker = new Worker(
  new URL("lindenmayer2.umd.js", import.meta.url),
  { type: "module" }
);
