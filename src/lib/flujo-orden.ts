/**
 * Los dos carriles de una orden.
 *
 * ── La regla del negocio ─────────────────────────────────────────────
 * Pablo: "cuando definimos el flujo podríamos tener 2 caminos paralelos
 * perfectamente viables. 1 es el flujo del dinero para el cual tenemos la
 * columna PAGO. El otro es el flujo de la cocina donde usamos la columna
 * PREPARACION. Entonces la orden se cierra cuando está pagado y
 * entregado... sino está bien que esté incompleto."
 *
 * ── Lo que estaba mal ────────────────────────────────────────────────
 * Había un solo campo (status) con una escalera que mezclaba los dos:
 *
 *   DRAFT → PLACED → IN_KITCHEN → READY → SERVED → PAID
 *                                            ↑         ↑
 *                                        entregar   cobrar
 *
 * El problema: de READY (lista) no había camino a PAID sin pasar por
 * SERVED (entregada). Si alguien cobraba antes de entregar, la orden no
 * podía avanzar. Y como la sesión ya se había cerrado, quedaba trabada
 * para siempre. Es exactamente lo que pasó con la orden de Pedro.
 *
 * ── Lo que hay ahora ─────────────────────────────────────────────────
 * Dos carriles independientes, cada uno con su fecha:
 *
 *   COCINA    status:       PLACED → IN_KITCHEN → READY
 *   ENTREGA   entregadoAt:  null → fecha
 *   DINERO    paidAt:       null → fecha
 *
 * Cobrar NO toca la preparación. Entregar NO toca el pago. Una orden está
 * terminada cuando sus dos fechas existen.
 */

/** El carril de la cocina, en orden. PAID/SERVED son valores heredados. */
export type EstadoCocina = "DRAFT" | "PLACED" | "IN_KITCHEN" | "READY" | "SERVED" | "PAID" | "CANCELLED";

export interface OrdenConFlujos {
  status: string;
  paidAt: Date | string | null;
  entregadoAt: Date | string | null;
}

/* ── Valores heredados ────────────────────────────────────────────────
   Las órdenes viejas no tienen paidAt ni entregadoAt: su estado vive
   todo en `status`. Estas dos funciones los traducen para que la
   interfaz no tenga que saber de qué época es cada fila. */

/** ¿Ya se cobró? Respeta las órdenes viejas que solo tienen status. */
export function estaPagada(o: OrdenConFlujos): boolean {
  if (o.paidAt) return true;
  /* Heredado: solo PAID significa cobrado. SERVED NO: antes significaba
     "entregada, falta cobrar", y tratarla como pagada escondía las cuentas
     pendientes en el tab de cerradas. */
  return o.status === "PAID";
}

/** ¿Ya se entregó? */
export function estaEntregada(o: OrdenConFlujos): boolean {
  if (o.entregadoAt) return true;
  // Heredado: SERVED y PAID significaban "ya salió de la cocina".
  return o.status === "SERVED" || o.status === "PAID";
}

/** ¿Se puede cerrar la cuenta? Solo si todo está pagado Y entregado. */
export function estaTerminada(o: OrdenConFlujos): boolean {
  return estaPagada(o) && estaEntregada(o);
}

/* ── Lo que ve el operador ────────────────────────────────────────────
   Dos etiquetas por orden, una por columna de la tabla de Órdenes. */

/** Columna PREPARACIÓN: dónde va la cocina. */
export function etiquetaPreparacion(o: OrdenConFlujos): string {
  if (o.status === "CANCELLED") return "Cancelada";
  if (estaEntregada(o)) return "Entregada";

  switch (o.status) {
    case "DRAFT": return "Borrador";
    case "PLACED": return "Recibida";
    case "IN_KITCHEN": return "Preparando";
    case "READY": return "Lista";
    default: return "Recibida";
  }
}

/** Columna PAGO: el carril del dinero. */
export function etiquetaPago(o: OrdenConFlujos & { metodoPago?: string | null }): string {
  if (estaPagada(o)) {
    const m = o.metodoPago;
    if (m === "ON_ACCOUNT") return "A cuenta";
    if (m === "CARD") return "Tarjeta";
    if (m === "TRANSFER") return "Transferencia";
    return "Cobrada";
  }
  return "Por cobrar";
}

/** Color de la etiqueta de preparación (tokens de operación). */
export function colorPreparacion(o: OrdenConFlujos): string {
  if (o.status === "CANCELLED") return "op-neutral";
  if (estaEntregada(o)) return "text-white bg-[#167D2E]";
  switch (o.status) {
    case "READY": return "text-white bg-[#B45309]";
    case "IN_KITCHEN": return "op-info";
    default: return "op-neutral";
  }
}

/** Color de la etiqueta de pago. */
export function colorPago(o: OrdenConFlujos): string {
  return estaPagada(o) ? "text-white bg-[#167D2E]" : "op-neutral";
}

/* ── Los grupos de los tabs ───────────────────────────────────────────
   Los tabs siguen el FLUJO, no los estados internos. */

export type GrupoOrden = "activas" | "por-cobrar" | "por-entregar" | "cerradas" | "canceladas" | "todas";

export function enGrupo(o: OrdenConFlujos, grupo: GrupoOrden): boolean {
  if (grupo === "todas") return true;
  if (o.status === "CANCELLED") return grupo === "canceladas";

  const pagada = estaPagada(o);
  const entregada = estaEntregada(o);

  switch (grupo) {
    case "canceladas": return false;
    /* Activas: en la cocina o esperando en la barra. Nada terminado. */
    case "activas": return !entregada;
    /* Por cobrar: salió de la cocina pero el dinero no ha llegado. */
    case "por-cobrar": return entregada && !pagada;
    /* Por entregar: ya se cobró pero sigue en la cocina. */
    case "por-entregar": return pagada && !entregada;
    /* Cerradas: las dos cosas hechas. */
    case "cerradas": return pagada && entregada;
  }
}
