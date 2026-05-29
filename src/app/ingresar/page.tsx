"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if already logged in
  useEffect(() => {
    fetch("/api/auth/customer/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.customer) router.replace(redirect);
      })
      .catch(() => {});
  }, [redirect, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Completa todos los campos");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Error al iniciar sesión");
      }
      router.push(redirect);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError("Completa todos los campos (contraseña: mínimo 6 caracteres)");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Error al registrarse");
      }
      setSuccess("¡Cuenta creada! Redirigiendo…");
      setTimeout(() => router.push(redirect), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black text-white tracking-tight">
          HANGAR<span className="text-amber-400">CINCO</span>
        </h1>
        <p className="text-amber-100/60 text-sm mt-1">Tu cuenta</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-lg border border-amber-400/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-amber-400/10">
          <button
            onClick={() => { setTab("login"); setError(null); setSuccess(null); }}
            className={`flex-1 py-4 text-sm font-bold transition-all ${
              tab === "login"
                ? "text-amber-400 border-b-2 border-amber-400 bg-amber-400/5"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => { setTab("register"); setError(null); setSuccess(null); }}
            className={`flex-1 py-4 text-sm font-bold transition-all ${
              tab === "register"
                ? "text-amber-400 border-b-2 border-amber-400 bg-amber-400/5"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Crear cuenta
          </button>
        </div>

        {/* Forms */}
        <div className="p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-3 text-sm mb-4">
              {success}
            </div>
          )}

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  autoComplete="current-password"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-60 text-slate-900 font-black py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all"
              >
                {loading ? "Entrando…" : "Entrar"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="¿Cómo te llamas?"
                  autoComplete="name"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Teléfono (opcional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 555 000 0000"
                  autoComplete="tel"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-60 text-slate-900 font-black py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all"
              >
                {loading ? "Creando cuenta…" : "Crear cuenta"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Skip / Continue as guest */}
      <Link
        href={redirect}
        className="mt-6 text-sm text-gray-400 hover:text-amber-300 transition-colors"
      >
        Continuar como invitado →
      </Link>

      <Link
        href="/login"
        className="mt-2 text-xs text-gray-500 hover:text-gray-400 transition-colors"
      >
        ¿Trabajas aquí? Acceso empleados
      </Link>
    </div>
  );
}

export default function IngresarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
