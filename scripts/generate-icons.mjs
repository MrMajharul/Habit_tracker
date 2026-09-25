#!/usr/bin/env node
// scripts/generate-icons.mjs — derive all icon sizes from the user-supplied icon-512.png
import sharp from "sharp";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, "..", "public", "icon-512.png");
const buf = readFileSync(src);

const targets = [
  { size: 512, out: "public/icons/icon-512.png" },
  { size: 192, out: "public/icons/icon-192.png" },
  { size: 64,  out: "public/favicon-64.png"     },   // fallback PNG favicon
];

for (const { size, out } of targets) {
  const outPath = join(__dirname, "..", out);
  await sharp(buf)
    .resize(size, size)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outPath);
  console.log(`✓  ${size}×${size}  →  ${out}`);
}

console.log("\nDone.");
