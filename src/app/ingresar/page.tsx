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
    <div className="min-h-screen bg-night text-cream flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-10 text-center">
        <h1 className="display text-4xl tracking-[0.06em]">
          HANGAR <em>N°5</em>
        </h1>
        <p className="kicker mt-3">Tu cuenta</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md card-night overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-line">
          <button
            onClick={() => { setTab("login"); setError(null); setSuccess(null); }}
            className={`flex-1 py-4 text-[11px] tracking-[0.2em] uppercase font-semibold transition-all ${
              tab === "login"
                ? "text-gold border-b-2 border-gold bg-gold/5"
                : "text-faint hover:text-muted"
            }`}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => { setTab("register"); setError(null); setSuccess(null); }}
            className={`flex-1 py-4 text-[11px] tracking-[0.2em] uppercase font-semibold transition-all ${
              tab === "register"
                ? "text-gold border-b-2 border-gold bg-gold/5"
                : "text-faint hover:text-muted"
            }`}
          >
            Crear cuenta
          </button>
        </div>

        {/* Forms */}
        <div className="p-7">
          {error && (
            <div className="rounded-[10px] border border-bad/40 bg-bad/10 text-bad px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-[10px] border border-ok/40 bg-ok/10 text-ok px-4 py-3 text-sm mb-5">
              {success}
            </div>
          )}

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="label-night">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  className="input-night"
                />
              </div>
              <div>
                <label className="label-night">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  autoComplete="current-password"
                  className="input-night"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full text-center disabled:opacity-60"
              >
                {loading ? "Entrando…" : "Entrar"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="label-night">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="¿Cómo te llamas?"
                  autoComplete="name"
                  className="input-night"
                />
              </div>
              <div>
                <label className="label-night">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  className="input-night"
                />
              </div>
              <div>
                <label className="label-night">Teléfono (opcional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 555 000 0000"
                  autoComplete="tel"
                  className="input-night"
                />
              </div>
              <div>
                <label className="label-night">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  className="input-night"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full text-center disabled:opacity-60"
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
        className="mt-7 text-[11px] tracking-[0.2em] uppercase text-muted hover:text-gold transition-colors"
      >
        Continuar como invitado →
      </Link>

      <Link
        href="/login"
        className="mt-3 text-[11px] tracking-[0.18em] uppercase text-faint hover:text-muted transition-colors"
      >
        ¿Trabajas aquí? Acceso empleados
      </Link>
    </div>
  );
}

export default function IngresarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-night flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
