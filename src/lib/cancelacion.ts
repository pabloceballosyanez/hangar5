/**
 * Qué se cancela y qué se cobra en una orden.
 *
 * ── El caso real ────────────────────────────────────────────────────
 * Se quemó el último insumo, o se cayó la última cerveza. El pedido ya
 * salió a medio camino: unos platillos se entregaron, otros no. Cancelar
 * la orden entera marca todo como cancelado — y entonces el sistema dice
 * "no se cobra", aunque el cliente ya se comió lo servido.
 *
 * ── La regla ────────────────────────────────────────────────────────
 * Lo que ya se entregó, se cobra. Lo que no, se cancela.
 *
 *   SERVED   → se queda SERVED, entra al cobro
 *   READY    → ya está hecho aunque no salga: se cobra (se desechó)
 *   PENDING  → se cancela, no se cobra
 *   CANCELLED→ se queda igual
 *
 * READY cuenta como cobrable a propósito: si el platillo ya se cocinó y
 * el cliente canceló, el insumo ya se gastó. Desecharlo sin cobrar es
 * regalar mercancía.
 */

/** Estados de ítem que ya se ganaron el cobro. */
export const ITEM_COBRABLE = ["SERVED", "READY"] as const;

/** Estados de ítem que sí se cancelan. */
export const ITEM_CANCELABLE = ["PENDING"] as const;

export interface ItemParaCancelar {
  id: string;
  status: string;
  quantity: number;
  unitPrice: number;
}

export interface RepartoCancelacion {
  /** Ítems que se cancelan (no se cobran). */
  seCancelan: ItemParaCancelar[];
  /** Ítems que se quedan y hay que cobrar. */
  seCobran: ItemParaCancelar[];
  /** Monto que sigue siendo cobrable, en centavos. */
  montoCobrable: number;
  /** Monto que se libera al cancelar, en centavos. */
  montoCancelado: number;
  /** true si no queda nada cobrable: la orden sí se cancela completa. */
  todoCancelado: boolean;
}

/**
 * Reparte los ítems de una orden entre lo que se cancela y lo que se cobra.
 */
export function repartirCancelacion(items: ItemParaCancelar[]): RepartoCancelacion {
  const seCancelan: ItemParaCancelar[] = [];
  const seCobran: ItemParaCancelar[] = [];

  for (const it of items) {
    if (it.status === "CANCELLED") {
      // Ya estaba cancelado: no cuenta para nada.
      continue;
    }
    if ((ITEM_COBRABLE as readonly string[]).includes(it.status)) {
      seCobran.push(it);
    } else {
      seCancelan.push(it);
    }
  }

  const montoCobrable = seCobran.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const montoCancelado = seCancelan.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return {
    seCancelan,
    seCobran,
    montoCobrable,
    montoCancelado,
    todoCancelado: seCobran.length === 0,
  };
}
