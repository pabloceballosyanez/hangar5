import { NextRequest, NextResponse } from "next/server";

const ADMIN_PW = process.env.ADMIN_PASSWORD;
if (!ADMIN_PW) {
  console.error("ADMIN_PASSWORD env var is not set!");
}
const COOKIE_NAME = "hangar5_admin_session";

function baseUrl(req: NextRequest): string {
  // Use forwarded headers from Cloudflare/Render proxy
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "hangar5.onrender.com";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
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
      return NextResponse.redirect(new URL("/admin/login?error=1", baseUrl(req)));
    }

    const response = NextResponse.redirect(new URL("/admin", baseUrl(req)));
    response.cookies.set(COOKIE_NAME, "true", {
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
