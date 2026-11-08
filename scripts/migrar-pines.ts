import { prisma } from "../src/lib/prisma";
import { generarPin, hashearPin } from "../src/lib/pines";

/**
 * Migra los PIN en claro a hasheados y reparte uno único a quien comparte.
 *
 * Pablo y Yadi tenían los dos "0000". Dos personas con el mismo PIN
 * rompen el registro de quién hizo qué: el sistema no puede distinguirlas.
 *
 * Imprime los PIN nuevos para que se los des. No se vuelven a mostrar.
 */
async function main() {
  const staff = await prisma.staff.findMany({ select: { id: true, name: true, pin: true } });

  const hashes: string[] = staff.map((s) => s.pin).filter((p): p is string => !!p && p.includes(":"));

  console.log("=== MIGRACIÓN DE PINs ===\n");
  const asignados: Array<{ nombre: string; pin: string }> = [];

  for (const s of staff) {
    const enClaro = !!s.pin && !s.pin.includes(":");
    if (!enClaro) continue;

    const pin = generarPin(hashes);
    hashes.push(hashearPin(pin));

    await prisma.staff.update({
      where: { id: s.id },
      data: {
        pin: hashearPin(pin),
        /* El "0000" era un PIN de arranque, no elegido. Se obliga a
           cambiarlo al entrar. */
        debeCambiarPin: true,
        pinActualizadoAt: new Date(),
      },
    });

    asignados.push({ nombre: s.name, pin });
  }

  if (asignados.length === 0) {
    console.log("  Nada que migrar: todos los PIN ya están hasheados.");
  } else {
    console.log("  PIN TEMPORAL (una sola vez):\n");
    for (const a of asignados) {
      console.log(`    ${a.nombre.padEnd(18)} ${a.pin}`);
    }
    console.log("\n  Al entrar, cada uno tendrá que elegir el suyo.");
  }
}

main()
  .catch((e) => { console.error("ERROR:", e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
