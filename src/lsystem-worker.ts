export const LSystemWorker = new Worker(
  new URL("lsystem.ts", import.meta.url),
  { type: "module" }
);
