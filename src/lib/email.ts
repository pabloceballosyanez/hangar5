import nodemailer from "nodemailer";

interface EmailBooking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  itemName: string;
  itemType: string;
  startDate: Date;
  endDate: Date;
  guests: number;
  totalPrice: number;
  status: string;
  paymentMethod?: string | null;
  notes?: string | null;
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 0 });
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    cabana: "Cabaña",
    glamping: "Glamping",
    moto: "Moto",
    bici: "Bicicleta",
    parapente: "Parapente",
    aladelta: "Ala Delta",
    hike: "Hike",
  };
  return labels[type] || type;
}

const paymentLabels: Record<string, string> = {
  card: "💳 Tarjeta de crédito/débito",
  transfer: "🏦 Transferencia bancaria",
  cash: "💵 Efectivo al llegar",
};

function buildEmailHtml(booking: EmailBooking): string {
  const typeLabel = getTypeLabel(booking.itemType);
  const isRent = booking.itemType === "moto" || booking.itemType === "bici";
  const isAct = ["parapente", "aladelta", "hike"].includes(booking.itemType);
  const unit = isAct ? "persona" : isRent ? "día(s)" : "noche(s)";
  const days = isAct
    ? 1
    : Math.max(1, Math.ceil((booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const paymentLabel = paymentLabels[booking.paymentMethod || ""] || "Pendiente";
  const bankName = process.env.BANK_NAME || "";
  const bankClabe = process.env.BANK_CLABE || "";
  const bankHolder = process.env.BANK_ACCOUNT_HOLDER || "";
  const bankCard = process.env.BANK_CARD || "";

  let paymentSection = "";
  if (booking.paymentMethod === "transfer") {
    paymentSection = `
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:20px;margin:16px 0;">
        <p style="font-weight:600;margin:0 0 10px;color:#92400e;">📋 Datos para tu transferencia</p>
        ${bankName ? `<p style="margin:4px 0;color:#78350f;"><strong>Banco:</strong> ${bankName}</p>` : ""}
        ${bankClabe ? `<p style="margin:4px 0;color:#78350f;"><strong>CLABE:</strong> <span style="font-family:monospace;font-weight:700;">${bankClabe}</span></p>` : ""}
        ${bankCard ? `<p style="margin:4px 0;color:#78350f;"><strong>Tarjeta:</strong> <span style="font-family:monospace;">${bankCard}</span></p>` : ""}
        ${bankHolder ? `<p style="margin:4px 0;color:#78350f;"><strong>Titular:</strong> ${bankHolder}</p>` : ""}
        <p style="margin:4px 0;color:#78350f;"><strong>Referencia:</strong> <span style="font-family:monospace;font-weight:700;">${booking.id.slice(-8).toUpperCase()}</span></p>
        <p style="margin:10px 0 0;font-size:13px;color:#92400e;font-style:italic;">
          Envía tu comprobante al <strong>+52 722 455 6628</strong> (WhatsApp) para confirmar tu pago.
        </p>
      </div>`;
  } else if (booking.paymentMethod === "cash") {
    paymentSection = `
      <p style="color:#1b4235;font-size:14px;margin:12px 0;">
        💵 Paga en efectivo cuando llegues a Hangar&nbsp;5.
      </p>`;
  }

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:8px;">
      <div style="background:#1b4235;padding:32px 24px;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="color:white;margin:0;font-size:20px;letter-spacing:3px;text-transform:uppercase;">Hangar 5</h1>
      </div>

      <div style="background:white;padding:32px 24px;border:1px solid #e5e7eb;">
        <p style="font-size:14px;color:#5c3d2e;">Hola <strong>${booking.customerName}</strong>,</p>
        <p style="font-size:14px;color:#5c3d2e;">
          ${booking.status === "confirmed" ? "Tu reserva ha sido <strong style='color:#1b4235;'>confirmada</strong>." : "Tu reserva está <strong style='color:#b88364;'>pendiente</strong> de pago."}
          Aquí están los detalles:
        </p>

        <div style="background:#faf7f5;border-radius:8px;padding:20px;margin:16px 0;">
          <p style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#b88364;margin:0 0 12px;">${typeLabel}</p>
          <h2 style="font-size:22px;color:#1b4235;margin:0 0 8px;">${booking.itemName}</h2>
          <p style="font-size:13px;color:#5c3d2e;margin:4px 0;">
            ${fmtDate(booking.startDate)} → ${fmtDate(booking.endDate)}
          </p>
          <p style="font-size:12px;color:#b88364;margin:4px 0;">
            ${days} ${unit} · ${booking.guests} ${booking.guests === 1 ? "persona" : "personas"}
          </p>
          <p style="font-size:12px;color:#b88364;margin:4px 0;">
            ${paymentLabel}
          </p>

          <hr style="border:none;border-top:1px solid #e0d6cf;margin:16px 0;" />

          <p style="font-size:20px;font-weight:600;color:#1b4235;margin:0;">
            $${formatPrice(booking.totalPrice)} <span style="font-size:12px;color:#b88364;font-weight:400;">MXN</span>
          </p>
        </div>

        ${paymentSection}

        ${booking.notes ? `<p style="font-size:12px;color:#b88364;font-style:italic;">Nota: ${booking.notes}</p>` : ""}

        <hr style="border:none;border-top:1px solid #e0d6cf;margin:20px 0;" />

        <p style="font-size:11px;color:#9ca3af;text-align:center;margin:0;">
          ID de reserva: ${booking.id}
        </p>
      </div>

      <div style="background:#faf7f5;padding:24px;text-align:center;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;border-top:none;">
        <p style="font-size:12px;color:#b88364;margin:0 0 4px;">
          Hangar 5 · El Peñón, Temascaltepec
        </p>
        <p style="font-size:11px;color:#b88364;margin:0;">
          <a href="tel:+527224556628" style="color:#b88364;">+52 722 455 6628</a>
          · <a href="mailto:hangar.cinco.mexico@gmail.com" style="color:#b88364;">hangar.cinco.mexico@gmail.com</a>
          · @hangar5_mexico
        </p>
      </div>
    </div>
  `;
}

export async function sendConfirmationEmail(booking: EmailBooking): Promise<boolean> {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.log("[email] No EMAIL_USER/EMAIL_PASS configured — skipping email");
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: emailUser, pass: emailPass },
    });

    const isConfirmed = booking.status === "confirmed";
    const subject = isConfirmed
      ? `✅ Reserva Confirmada — ${booking.itemName} · Hangar 5`
      : `⏳ Reserva Pendiente — ${booking.itemName} · Hangar 5`;

    await transporter.sendMail({
      from: `"Hangar 5" <${emailUser}>`,
      to: booking.customerEmail,
      bcc: emailUser,
      subject,
      html: buildEmailHtml(booking),
    });

    console.log(`[email] Confirmation sent to ${booking.customerEmail}`);
    return true;
  } catch (err) {
    console.error("[email] Failed to send:", err instanceof Error ? err.message : err);
    return false;
  }
}
