import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const workspace = resolve(process.cwd());
const standaloneServerEntry = resolve(workspace, "dist", "standalone", "server.js");
const sourceConfig = resolve(workspace, ".openai", "hosting.json");
const targetConfig = resolve(workspace, "dist", ".openai", "hosting.json");

if (!existsSync(standaloneServerEntry)) {
  throw new Error("Vinext did not create dist/standalone/server.js.");
}

if (!existsSync(sourceConfig)) {
  throw new Error(".openai/hosting.json is missing.");
}

mkdirSync(dirname(targetConfig), { recursive: true });
copyFileSync(sourceConfig, targetConfig);
