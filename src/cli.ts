#!/usr/bin/env node
import { parseArgs } from "zod-args";
import { z } from "zod";
import { createZodJsonRpcServer } from "./server";
import { resolve } from "path";
import express from "express";
import cors from "cors";

async function main() {
  const { port, module, endpoint, transpile } = parseArgs({
    port: z.number().default(2288),
    module: z.string(),
    endpoint: z.string().default("/rpc"),
    transpile: z.boolean(),
  });

  if (transpile) {
    require("ts-node/register/transpile-only");
  }

  const app = express();
  app.use(cors());
  createZodJsonRpcServer(
    (await import(resolve(module))).default,
    app,
    endpoint
  );

  app.listen(port);
  console.log("Listening on port", port);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
