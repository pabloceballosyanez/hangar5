import { NextRequest, NextResponse } from "next/server";

const ADMIN_PW = "hangar5admin2026";
const COOKIE_NAME = "hangar5_admin_session";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const password = formData.get("password") as string;

  if (password !== ADMIN_PW) {
    return NextResponse.redirect("/admin/login?error=1");
  }

  const response = NextResponse.redirect("/admin");
  response.cookies.set(COOKIE_NAME, "true", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return response;
}
