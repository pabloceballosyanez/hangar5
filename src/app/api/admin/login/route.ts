import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { signAdminSession } from "@/lib/auth";

const ADMIN_PW = process.env.ADMIN_PASSWORD;
if (!ADMIN_PW) {
  console.error("ADMIN_PASSWORD env var is not set!");
}
const COOKIE_NAME = "hangar5_admin_session";

function getClientIP(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function baseUrl(req: NextRequest): string {
  // Use forwarded headers from Cloudflare/Render proxy
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "hangar5.onrender.com";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  // Rate limit: 5 attempts per 15 min per IP
  const ip = getClientIP(req);
  const limit = rateLimit(`admin-login:${ip}`, 5, 900);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo más tarde." },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.resetIn),
        },
      }
    );
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let password = "";

    if (contentType.includes("json")) {
      const body = await req.json();
      password = body.password || "";
    } else {
      const formData = await req.formData();
      password = (formData.get("password") as string) || "";
    }

    if (password !== ADMIN_PW) {
      return NextResponse.redirect(new URL(`/admin/login?error=1`, baseUrl(req)));
    }

    const token = signAdminSession();
    const response = NextResponse.redirect(new URL("/admin", baseUrl(req)));
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL("/admin/login?error=1", baseUrl(req)));
  }
}
