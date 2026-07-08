import { NextRequest, NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/auth";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("hangar5_admin_session")?.value;
  if (!token || !validateAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "/data/hangar5.db";
  const absolutePath = path.resolve(dbPath);

  if (!fs.existsSync(absolutePath)) {
    return NextResponse.json({ error: "Database not found", path: absolutePath }, { status: 404 });
  }

  const dbContent = fs.readFileSync(absolutePath);
  return new NextResponse(dbContent, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="hangar5-prod-${new Date().toISOString().split("T")[0]}.db"`,
      "Content-Length": String(dbContent.length),
    },
  });
}
