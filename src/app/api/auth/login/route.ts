import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/auth/login — login por PIN
export async function POST(req: NextRequest) {
  try {
    const { staffId, pin } = await req.json();

    if (!staffId || !pin) {
      return NextResponse.json({ error: "ID y PIN requeridos" }, { status: 400 });
    }

    const staff = await prisma.staff.findUnique({ where: { id: staffId } });

    if (!staff || !staff.isActive) {
      return NextResponse.json({ error: "Usuario no encontrado o inactivo" }, { status: 401 });
    }

    if (staff.pin !== pin) {
      return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
    }

    // Crear cookie de sesión con rol
    const session = JSON.stringify({
      staffId: staff.id,
      name: staff.name,
      role: staff.role,
    });

    const response = NextResponse.json({
      success: true,
      staff: { id: staff.id, name: staff.name, role: staff.role },
    });

    response.cookies.set("hangar5_session", Buffer.from(session).toString("base64"), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12, // 12 horas
    });

    return response;
  } catch (err) {
    console.error("[POST /api/auth/login]", err);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}

// GET /api/auth/login — obtener sesión actual
export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("hangar5_session")?.value;
  if (!cookie) {
    return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
  }

  try {
    const session = JSON.parse(Buffer.from(cookie, "base64").toString("utf-8"));
    return NextResponse.json({ staff: session });
  } catch {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  }
}

// DELETE /api/auth/login — logout
export async function DELETE(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.set("hangar5_session", "", { maxAge: 0, path: "/" });
  return response;
}
