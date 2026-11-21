import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

const ctx = await esbuild.context({
  entryPoints: [resolve(root, "src/index.js")],
  bundle: true,
  format: "iife",
  target: ["es2022"],
  legalComments: "none",
  charset: "utf8",
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  outfile: resolve(root, "dist/ha-dashboard.js"),
  logLevel: "info",
});
await ctx.watch();

const server = spawn(process.execPath, [resolve(root, "scripts/serve.mjs")], { stdio: "inherit" });
process.on("SIGINT", () => {
  server.kill();
  process.exit(0);
});
