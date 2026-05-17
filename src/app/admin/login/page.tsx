"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

const ADMIN_PW = "hangar5admin2026";
const SESSION_KEY = "hangar5_admin_session";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session === "true") {
      const from = new URLSearchParams(window.location.search).get("from") || "/admin";
      router.replace(from);
    } else {
      setChecking(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    await new Promise(r => setTimeout(r, 400));

    if (password !== ADMIN_PW) {
      setError("Contraseña incorrecta");
      setLoading(false);
      return;
    }

    localStorage.setItem(SESSION_KEY, "true");
    const from = new URLSearchParams(window.location.search).get("from") || "/admin";
    router.replace(from);
  };

  if (checking) {
    return (
      <main className="min-h-screen bg-[#1b4235] flex items-center justify-center">
        <div className="text-white/50 text-sm">Verificando sesión...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#1b4235] flex items-center justify-center">
      <div className="w-full max-w-sm mx-4">
        <div className="bg-white rounded-lg p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-serif text-[#1b4235] mb-2">Hangar 5</h1>
            <p className="text-sm text-[#b88364] uppercase tracking-wider">Admin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs tracking-[0.2em] uppercase text-[#b88364] mb-2 font-medium">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              disabled={loading}
              className="w-full py-4 bg-[#1b4235] text-white rounded-lg uppercase tracking-wider text-sm font-medium hover:bg-[#0f2a20] transition-colors disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
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
