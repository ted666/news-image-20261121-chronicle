// Copies entry.png to the harness output directory, validating it first.
// Node 22, standard library only.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const MAX_BYTES = 1048576;
const MAX_SIDE = 1024;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

const source = "entry.png";
let data;
try {
  data = readFileSync(source);
} catch {
  fail(`cannot read ${source}`);
}

if (data.length > MAX_BYTES) {
  fail(`${source} is ${data.length} bytes, over the 1 MiB limit`);
}
if (!data.subarray(0, 8).equals(PNG_MAGIC)) {
  fail(`${source} does not start with the PNG signature`);
}
if (data.length < 33) {
  fail(`${source} is too short to hold a PNG header`);
}
if (data.readUInt32BE(8) !== 13 || data.subarray(12, 16).toString("ascii") !== "IHDR") {
  fail(`${source} is missing its IHDR chunk`);
}
const width = data.readUInt32BE(16);
const height = data.readUInt32BE(20);
if (width > MAX_SIDE || height > MAX_SIDE) {
  fail(`${source} is ${width}x${height}, over the 1024x1024 limit`);
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const outPath = join(outDir, "entry.png");
mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, data);

const back = readFileSync(outPath);
if (!back.equals(data)) {
  fail(`readback of ${outPath} differs from ${source}`);
}
console.log(`wrote ${outPath} (${data.length} bytes, ${width}x${height})`);
