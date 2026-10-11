import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConfirmationPageProps {
  params: Promise<{ qrToken: string }>;
  searchParams: Promise<{
    orderId?: string;
    status?: string;
  }>;
}

// ─── Status config ────────────────────────────────────────────────────────────

interface StatusConfig {
  emoji: string;
  title: string;
  subtitle: string;
  bgClass: string;
  borderClass: string;
  titleClass: string;
  subtitleClass: string;
}

function getStatusConfig(status: string | undefined): StatusConfig {
  switch (status) {
    case "approved":
    case "cash":
      return {
        emoji: "✅",
        title: "¡Pedido confirmado!",
        subtitle:
          "Tu pago fue aprobado. Tu orden está en preparación — pronto llegará a tu mesa.",
        bgClass: "bg-green-50",
        borderClass: "border-green-200",
        titleClass: "text-green-800",
        subtitleClass: "text-green-600",
      };
    case "pending":
      return {
        emoji: "⏳",
        title: "Pago pendiente",
        subtitle:
          "Tu pago está siendo procesado. Te avisaremos cuando se confirme y empecemos con tu orden.",
        bgClass: "bg-yellow-50",
        borderClass: "border-yellow-200",
        titleClass: "text-yellow-800",
        subtitleClass: "text-yellow-600",
      };
    case "rejected":
      return {
        emoji: "❌",
        title: "Pago rechazado",
        subtitle:
          "No pudimos procesar tu pago. Podés intentarlo nuevamente o elegir otro método.",
        bgClass: "bg-red-50",
        borderClass: "border-red-200",
        titleClass: "text-red-800",
        subtitleClass: "text-red-600",
      };
    default:
      return {
        emoji: "📋",
        title: "Orden registrada",
        subtitle: "Tu orden ha sido recibida.",
        bgClass: "bg-ink-3",
        borderClass: "border-hair",
        titleClass: "text-snow",
        subtitleClass: "text-ash",
      };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default async function ConfirmationPage({
  params,
  searchParams,
}: ConfirmationPageProps) {
  const { qrToken } = await params;
  const { orderId, status } = await searchParams;

  const cfg = getStatusConfig(status);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-2">
      {/* Big emoji */}
      <span className="text-7xl leading-none">{cfg.emoji}</span>

      {/* Status card */}
      <div
        className={`w-full rounded-2xl border ${cfg.bgClass} ${cfg.borderClass} px-5 py-5 space-y-2`}
      >
        <h1 className={`text-xl font-black ${cfg.titleClass}`}>{cfg.title}</h1>
        <p className={`text-sm leading-relaxed ${cfg.subtitleClass}`}>
          {cfg.subtitle}
        </p>
      </div>

      {/* Order ID */}
      {orderId && (
        <div className="bg-ink-2 rounded-xl border border-hair px-4 py-3 w-full">
          <p className="text-xs text-smoke font-semibold uppercase tracking-wide mb-1">
            Número de orden
          </p>
          <p className="text-sm font-mono text-snow-2 break-all">{orderId}</p>
        </div>
      )}

      {/* Steps (for approved/cash) */}
      {(status === "approved" || status === "cash") && (
        <div className="w-full bg-ink-2 rounded-2xl border border-hair shadow-sm px-5 py-4 space-y-3">
          <p className="text-sm font-bold text-snow-2 text-left">
            ¿Qué sigue?
          </p>
          <ol className="space-y-2 text-left">
            {[
              { icon: "👨🍳", text: "Tu orden entra a cocina" },
              { icon: "⏱️", text: "Tiempo estimado: ~15-25 min" },
              { icon: "🍽️", text: "El mesero lleva tu orden a la mesa" },
            ].map(({ icon, text }, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-base flex-none">
                  {icon}
                </span>
                <span className="text-sm text-ash">{text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Actions */}
      <div className="w-full flex flex-col gap-3">
        {status === "rejected" && orderId && (
          <Link
            href={`/menu/${qrToken}/payment?orderId=${orderId}`}
            className="w-full bg-amber-500 text-snow font-black py-4 rounded-2xl text-center text-base min-h-[56px] flex items-center justify-center shadow-md"
          >
            Intentar de nuevo
          </Link>
        )}

        {(status === "approved" || status === "cash") && orderId && (
          <Link
            href={`/menu/${qrToken}/tracker?orderId=${orderId}`}
            className="w-full bg-amber-500 text-snow font-black py-4 rounded-2xl text-center text-base min-h-[56px] flex items-center justify-center shadow-md"
          >
            👀 Seguir mi pedido
          </Link>
        )}

        <Link
          href={`/menu/${qrToken}`}
          className="w-full bg-ink-3 text-snow-2 font-bold py-4 rounded-2xl text-center text-base min-h-[56px] flex items-center justify-center"
        >
          🍴 Pedir algo más
        </Link>
      </div>

      <p className="text-xs text-smoke">
        Hangar 5 · Mesa {qrToken}
      </p>
    </div>
  );
}
