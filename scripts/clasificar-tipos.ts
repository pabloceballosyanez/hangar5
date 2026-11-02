import { prisma } from "../src/lib/prisma";
import { asegurarTipos, resumenTipos } from "../src/lib/tipos-producto";

async function main() {
  const { tiposCreados, clasificados } = await asegurarTipos();
  console.log(`Tipos creados: ${tiposCreados}`);
  console.log(`Platillos clasificados: ${clasificados}`);
  console.log();

  const resumen = await resumenTipos();

  let sinTipo = 0;
  console.log("=".repeat(72));
  console.log("  CLASIFICACIÓN POR TIPO");
  console.log("=".repeat(72));

  for (const t of resumen) {
    if (t.tipo === "Otro") sinTipo = t.platillos.length;
    console.log(`\n▸ ${t.tipo}  (${t.platillos.length})`);
    console.log(`  ${t.platillos.join(", ")}`);
    console.log(`  hereda hoy:  ${t.hereda.length ? t.hereda.join(", ") : "(nada)"}`);
    console.log(`  se propone:  ${t.sugerido.length ? t.sugerido.join(", ") : "(nada)"}`);
  }

  if (sinTipo > 0) {
    console.log(`\n⚠ ${sinTipo} platillo(s) quedaron sin clasificar ("Otro")`);
  }
}

main()
  .catch((e) => console.error("ERROR:", e.message))
  .finally(() => prisma.$disconnect());
