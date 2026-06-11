#!/usr/bin/env node
/**
 * Optimiza todas las imágenes en public/img/
 * - Redimensiona a max 1200px en el lado más largo
 * - JPEG: calidad 80
 * - PNG: mantiene formato, reduce colores si es posible
 * - Conserva nombres y rutas originales
 * - Reporta ahorro total
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const IMG_DIR = path.join(__dirname, "..", "public", "img");
const MAX_PX = 1200; // lado más largo
const JPEG_QUALITY = 80;

let totalBefore = 0;
let totalAfter = 0;
let processed = 0;
let skipped = 0;

function getAllFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      getAllFiles(full, files);
    } else if (/\.(jpg|jpeg|png|webp)$/i.test(e.name)) {
      files.push(full);
    }
  }
  return files;
}

async function optimize(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const before = fs.statSync(filePath).size;
  let pipeline = sharp(filePath);

  // Redimensionar manteniendo aspect ratio
  pipeline = pipeline.resize(MAX_PX, MAX_PX, {
    fit: "inside",
    withoutEnlargement: true,
  });

  // Aplicar compresión según formato
  if (ext === ".png") {
    pipeline = pipeline.png({ quality: 80, compressionLevel: 9 });
  } else if (ext === ".webp") {
    pipeline = pipeline.webp({ quality: JPEG_QUALITY });
  } else {
    pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
  }

  const buffer = await pipeline.toBuffer();
  const after = buffer.length;

  // Solo sobreescribir si realmente hay ahorro significativo (>5%)
  if (after < before * 0.95) {
    fs.writeFileSync(filePath, buffer);
    totalBefore += before;
    totalAfter += after;
    processed++;
    const pct = ((1 - after / before) * 100).toFixed(1);
    console.log(`  ✓ ${path.relative(IMG_DIR, filePath)}: ${(before/1024).toFixed(0)}KB → ${(after/1024).toFixed(0)}KB (-${pct}%)`);
    return true;
  } else {
    skipped++;
    if (processed < 10) {
      console.log(`  - ${path.relative(IMG_DIR, filePath)}: ya óptimo (${(before/1024).toFixed(0)}KB)`);
    }
    return false;
  }
}

async function main() {
  console.log("🔍 Buscando imágenes...\n");
  const files = getAllFiles(IMG_DIR);
  console.log(`   ${files.length} imágenes encontradas\n`);

  console.log("⚡ Optimizando...\n");
  for (const f of files) {
    try {
      await optimize(f);
    } catch (err) {
      console.log(`  ✗ ${path.relative(IMG_DIR, f)}: ERROR ${err.message}`);
    }
  }

  const savedMB = ((totalBefore - totalAfter) / (1024 * 1024)).toFixed(1);
  const pct = totalBefore > 0 ? ((1 - totalAfter / totalBefore) * 100).toFixed(1) : 0;

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅ ${processed} optimizadas | ${skipped} ya óptimas`);
  console.log(`📦 Antes: ${(totalBefore/(1024*1024)).toFixed(1)}MB → Ahora: ${(totalAfter/(1024*1024)).toFixed(1)}MB`);
  console.log(`💰 Ahorro: ${savedMB}MB (-${pct}%)\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
