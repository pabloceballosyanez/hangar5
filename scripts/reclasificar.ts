import { prisma } from "../src/lib/prisma";
import { tipoPorNombre } from "../src/lib/tipos-producto";

async function main() {
  const items = await prisma.menuItem.findMany({ select: { id: true, name: true, tipoId: true } });
  const tipos = await prisma.tipoProducto.findMany();
  const porNombre = new Map(tipos.map(t => [t.nombre, t.id]));
  let cambios = 0;
  let orden = tipos.length;

  for (const it of items) {
    const n = tipoPorNombre(it.name);
    let tid = porNombre.get(n);
    if (!tid) {
      const c = await prisma.tipoProducto.create({ data: { nombre: n, orden: orden++ } });
      tid = c.id; porNombre.set(n, tid);
      console.log(`  + tipo nuevo: ${n}`);
    }
    if (it.tipoId !== tid) {
      await prisma.menuItem.update({ where: { id: it.id }, data: { tipoId: tid } });
      console.log(`  ✓ ${it.name} → ${n}`);
      cambios++;
    }
  }
  console.log(`\n  reclasificados: ${cambios}`);
}
main().finally(() => prisma.$disconnect());
