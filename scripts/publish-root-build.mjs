import { copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist-client");

await copyFile(path.join(distDir, "index.html"), path.join(rootDir, "index.html"));
await copyFile(path.join(distDir, "favicon.svg"), path.join(rootDir, "favicon.svg"));
