import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "hangar5.onrender.com";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const base = `${proto}://${host}`;

  const response = NextResponse.redirect(new URL("/", base));
  response.cookies.set("hangar5_admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
