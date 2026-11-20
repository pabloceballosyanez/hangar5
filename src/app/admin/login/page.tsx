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
    <main className="min-h-screen bg-[var(--color-adp-pino)] flex items-center justify-center">
      <div className="w-full max-w-sm mx-4">
        <div className="bg-white rounded-lg p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-serif text-[var(--color-adp-pino)] mb-2">Hangar 5</h1>
            <p className="text-sm text-[var(--color-adp-pino)] uppercase tracking-wider">Admin</p>
          </div>

          <form method="POST" action="/api/admin/login" className="space-y-4">
            <div>
              <label className="block text-xs tracking-[0.2em] uppercase text-[var(--color-adp-pino)] mb-2 font-medium">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                className="w-full border border-[var(--color-adp-borde)] rounded-lg p-4 bg-white text-[var(--color-adp-pino)] focus:outline-none focus:border-[var(--color-adp-pino)] focus:ring-1 focus:ring-[var(--color-adp-pino)]/20 transition-all text-sm"
                placeholder="••••••••"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="bg-[var(--color-adp-papel-3)] text-[var(--color-adp-urgente)] rounded-lg p-3 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-[var(--color-adp-pino)] text-white rounded-lg uppercase tracking-wider text-sm font-medium hover:bg-[var(--color-adp-pino-hondo)] transition-colors"
            >
              Entrar
            </button>
          </form>

          <p className="text-[10px] text-[var(--color-adp-tinta-2)] text-center mt-6">
            Panel administrativo Hangar 5
          </p>
        </div>
      </div>
    </main>
  );
}
