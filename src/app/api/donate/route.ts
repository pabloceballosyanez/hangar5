import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

export async function POST(req: NextRequest) {
  const { amount } = await req.json();

  if (!amount || amount < 50) {
    return NextResponse.json({ error: "Monto mínimo: $50 MXN" }, { status: 400 });
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    return NextResponse.json({ error: "Pasarela no configurada" }, { status: 500 });
  }

  const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
  });
  const preference = new Preference(client);

  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://hangar5.onrender.com";

  const result = await preference.create({
    body: {
      items: [{
        id: "donacion-comunidad",
        title: "Donativo — Red Meteorológica Comunitaria",
        description: "Estaciones DIY Raspberry Pi para El Peñón, Temascaltepec",
        quantity: 1,
        unit_price: amount,
        currency_id: "MXN",
      }],
      back_urls: {
        success: `${baseUrl}/comunidad?gracias=true`,
        failure: `${baseUrl}/comunidad`,
        pending: `${baseUrl}/comunidad`,
      },
      auto_return: "approved",
      external_reference: `donacion_${Date.now()}`,
    },
  });

  return NextResponse.json({ url: result.init_point! });
}
