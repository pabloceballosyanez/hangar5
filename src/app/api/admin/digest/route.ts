import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.DIGEST_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { subject, html } = body;

  if (!subject || !html) {
    return NextResponse.json({ error: "Missing subject or html" }, { status: 400 });
  }

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    return NextResponse.json({ error: "Email not configured" }, { status: 500 });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: emailUser, pass: emailPass },
    });

    await transporter.sendMail({
      from: `"📰 Digest Financiero" <${emailUser}>`,
      to: "hangar5.admin@gmail.com",
      subject,
      html,
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[digest] Failed:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
