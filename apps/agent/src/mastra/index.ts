import { Mastra } from "@mastra/core";
import { server } from "repro-core/server";
import { roles } from "repro-core/roles";
import * as leaf from "repro-leaf";

const noop = (arg: any) => {};
noop(leaf);

console.log(server(), roles());

export const mastra = new Mastra({
  bundler: {
    transpilePackages: ["repro-core", "repro-leaf"],
  },
});
