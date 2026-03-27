import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

await mkdir(rootDir, { recursive: true });
await copyFile(path.join(rootDir, "index.dev.html"), path.join(rootDir, "index.html"));
