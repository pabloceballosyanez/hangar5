import { asegurarUbicaciones } from "../src/lib/ubicaciones";
import { prisma } from "../src/lib/prisma";

async function main() {
  const ubicaciones = await asegurarUbicaciones();
  console.log("Ubicaciones creadas:");
  for (const u of ubicaciones) console.log(`  ${u.clave.padEnd(12)} ${u.nombre}`);
}

main()
  .catch((e) => {
    console.error("ERROR:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
