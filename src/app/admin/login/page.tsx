import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const ADMIN_PW = process.env.ADMIN_PASSWORD;
if (!ADMIN_PW) {
  console.error("ADMIN_PASSWORD env var is not set!");
}
const COOKIE_NAME = "hangar5_admin_session";

export const dynamic = "force-dynamic";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const error = params.error === "1" ? "Contraseña incorrecta" : "";

  // Check if already logged in
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  if (session?.value === "true") {
    redirect(params.from || "/admin");
  }

  return (
    <main className="min-h-screen bg-[#1b4235] flex items-center justify-center">
      <div className="w-full max-w-sm mx-4">
        <div className="bg-white rounded-lg p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-serif text-[#1b4235] mb-2">Hangar 5</h1>
            <p className="text-sm text-[#b88364] uppercase tracking-wider">Admin</p>
          </div>

          <form method="POST" action="/api/admin/login" className="space-y-4">
            <div>
              <label className="block text-xs tracking-[0.2em] uppercase text-[#b88364] mb-2 font-medium">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                className="w-full border border-[#e0d6cf] rounded-lg p-4 bg-white text-[#1b4235] focus:outline-none focus:border-[#b88364] focus:ring-1 focus:ring-[#b88364]/20 transition-all text-sm"
                placeholder="••••••••"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="bg-[#fef0ef] text-[#8b1a1a] rounded-lg p-3 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-[#1b4235] text-white rounded-lg uppercase tracking-wider text-sm font-medium hover:bg-[#0f2a20] transition-colors"
            >
              Entrar
            </button>
          </form>

          <p className="text-[10px] text-gray-300 text-center mt-6">
            Panel administrativo Hangar 5
          </p>
        </div>
      </div>
    </main>
  );
}
