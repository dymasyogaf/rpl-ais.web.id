import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = process.cwd();
const DIST_DIR = resolve(ROOT, "dist");

const PATHS_TO_COPY = ["index.html", "latihan.html", "latihan", "assets", "components"];

await rm(DIST_DIR, { recursive: true, force: true });
await mkdir(DIST_DIR, { recursive: true });

for (const path of PATHS_TO_COPY) {
  await cp(resolve(ROOT, path), resolve(DIST_DIR, path), { recursive: true });
}

console.log("Static files copied to dist/");
