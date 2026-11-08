import { prisma } from "../src/lib/prisma";
import { generarPin, hashearPin } from "../src/lib/pines";
import { verifyPassword } from "../src/lib/auth";

/**
 * Detecta y corrige PINs repetidos entre personas.
 *
 * Estar hasheado no basta: tres cuentas tenían "0000" hasheado con salts
 * distintos, así que parecían únicas pero el PIN era el mismo. Si dos
 * personas comparten PIN, el registro de quién hizo qué deja de servir, y
 * una puede entrar como la otra.
 *
 * Se verifica contra una lista de los PIN probables en vez de comparar
 * hashes (imposible con salt). Es lo que pasa por comparar el PIN real de
 * cada quien cuando alguien intenta entrar.
 */
async function main() {
  const staff = await prisma.staff.findMany({
    select: { id: true, name: true, pin: true },
    orderBy: { name: "asc" },
  });

  console.log("=== PINs REPETIDOS ===\n");

  // Solo se pueden comparar contra los obvios; es justo donde importa.
  const CANDIDATOS = [
    "0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999",
    "1234", "4321", "1212", "2121", "1010", "0101",
  ];

  /** Quiénes comparten cada PIN. */
  const porPin = new Map<string, string[]>();
  for (const s of staff) {
    if (!s.pin) continue;
    for (const c of CANDIDATOS) {
      if (verifyPassword(c, s.pin)) {
        porPin.set(c, [...(porPin.get(c) ?? []), s.name]);
      }
    }
  }

  const choques = [...porPin.entries()].filter(([, n]) => n.length > 1);

  if (choques.length === 0) {
    console.log("  Ninguno. Todos los PIN obvios son de una sola persona.\n");
    return;
  }

  for (const [pin, nombres] of choques) {
    console.log(`  ${pin} lo usan: ${nombres.join(", ")}`);
  }

  console.log("\n  Repartiendo un PIN único a cada uno menos al primero...\n");

  const hashes: string[] = staff.map((s) => s.pin).filter((p): p is string => !!p);
  const nuevos: Array<{ nombre: string; pin: string }> = [];

  for (const [, nombres] of choques) {
    // El primero conserva el suyo; a los demás se les da uno nuevo
    for (const nombre of nombres.slice(1)) {
      const s = staff.find((x) => x.name === nombre);
      if (!s) continue;

      const pin = generarPin(hashes);
      hashes.push(hashearPin(pin));

      await prisma.staff.update({
        where: { id: s.id },
        data: {
          pin: hashearPin(pin),
          debeCambiarPin: true,
          pinActualizadoAt: new Date(),
        },
      });
      nuevos.push({ nombre, pin });
    }
  }

  console.log("  PIN TEMPORAL (una sola vez):\n");
  for (const n of nuevos) {
    console.log(`    ${n.nombre.padEnd(18)} ${n.pin}`);
  }
  console.log("\n  Al entrar, cada uno tendrá que elegir el suyo.");
}

main()
  .catch((e) => { console.error("ERROR:", e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
