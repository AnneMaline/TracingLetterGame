import { mkdir, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const outputDir = resolve(root, "artifacts");
const output = resolve(outputDir, "tracing-game-1.0.0.zip");

await mkdir(outputDir, { recursive: true });
await rm(output, { force: true });

await new Promise((resolvePromise, reject) => {
  const zip = spawn("zip", ["-qr", output, "."], { cwd: dist });
  zip.on("error", reject);
  zip.on("close", (code) => {
    if (code === 0) resolvePromise();
    else reject(new Error(`zip exited with status ${code}`));
  });
});

console.log(`Created ${output}`);
