import { prisma } from "@/lib/prisma";

/**
 * WhatsApp Cloud API (Meta) — order notifications.
 *
 * Fase 1: notify the customer when their order is READY.
 *
 * Required env vars (set in Render → Environment):
 *   WHATSAPP_ACCESS_TOKEN     — permanent token from Meta app (System User token)
 *   WHATSAPP_PHONE_NUMBER_ID  — the sender phone number ID (NOT the number itself)
 *   WHATSAPP_TEMPLATE_ORDER_READY — approved template name (default: "pedido_listo")
 *   WHATSAPP_TEMPLATE_LANG    — template language code (default: "es_MX")
 *
 * If not configured, all functions no-op silently (safe to deploy before
 * Meta business verification completes).
 *
 * Expected template ("pedido_listo", category UTILITY, lang es_MX):
 *   Body: "¡Hola {{1}}! 🍽️ Tu pedido #{{2}} en Hangar 5 está listo.
 *          Puedes pasar a recogerlo o espéralo en tu mesa. ¡Buen provecho!"
 */

const GRAPH_API_VERSION = "v21.0";

function isConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

/**
 * Normalize a Mexican phone number for WhatsApp (E.164 without '+').
 * "722 123 4567"    → "527221234567"
 * "+52 722 1234567" → "527221234567"
 * Returns null if it can't be normalized to something plausible.
 */
export function normalizeMxPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `52${digits}`;
  if (digits.length === 12 && digits.startsWith("52")) return digits;
  // Legacy "521..." mobile format (13 digits) — Meta accepts both, keep as-is
  if (digits.length === 13 && digits.startsWith("521")) return digits;
  return null;
}

/**
 * Low-level: send an approved template message.
 * Throws on HTTP error — callers decide whether to swallow.
 */
async function sendTemplate(
  toPhone: string,
  templateName: string,
  bodyParams: string[]
): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const token = process.env.WHATSAPP_ACCESS_TOKEN!;
  const lang = process.env.WHATSAPP_TEMPLATE_LANG || "es_MX";

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: lang },
          components: [
            {
              type: "body",
              parameters: bodyParams.map((text) => ({ type: "text", text })),
            },
          ],
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`WhatsApp API ${res.status}: ${body.slice(0, 500)}`);
  }
}

/**
 * Notify the customer that their order is READY.
 *
 * Fire-and-forget safe: never throws, never blocks the kitchen flow.
 * Only fires for QR orders (customer ordered from their own phone) that
 * captured a phone number.
 */
export async function notifyOrderReady(orderId: string): Promise<void> {
  try {
    if (!isConfigured()) return; // Meta not set up yet — silent no-op

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        source: true,
        customerName: true,
        customerPhone: true,
      },
    });

    if (!order) return;
    if (order.source !== "QR") return; // only online/QR customers
    if (!order.customerPhone) return;

    const to = normalizeMxPhone(order.customerPhone);
    if (!to) {
      console.warn(`[whatsapp] Teléfono no normalizable para orden ${orderId}: "${order.customerPhone}"`);
      return;
    }

    const templateName = process.env.WHATSAPP_TEMPLATE_ORDER_READY || "pedido_listo";
    const name = (order.customerName || "").trim().split(/\s+/)[0] || "cliente";
    const shortId = order.id.slice(-6).toUpperCase();

    await sendTemplate(to, templateName, [name, shortId]);
    console.log(`[whatsapp] Aviso 'pedido listo' enviado — orden ${shortId} → ${to.slice(0, 4)}****`);
  } catch (err) {
    // NEVER break the kitchen flow because of a notification failure
    console.error(`[whatsapp] Error al notificar orden ${orderId}:`, err);
  }
}
