'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Staff {
  id: string;
  name: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Admin',
  GERENTE: 'Gerente',
  GERENTE_TURNO: 'Gerente Turno',
  MESERO: 'Mesero',
  COCINERO: 'Cocinero',
  BAR: 'Bartender',
  RECEPCION: 'Recepción',
  CAJA: 'Caja',
};

const ROLE_EMOJI: Record<string, string> = {
  SUPER_ADMIN: '👑',
  GERENTE: '💼',
  GERENTE_TURNO: '🕐',
  MESERO: '🤵',
  COCINERO: '👨‍🍳',
  BAR: '🍸',
  RECEPCION: '🛎️',
  CAJA: '💰',
};

export default function LoginPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selected, setSelected] = useState<Staff | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/restaurant/staff')
      .then(r => r.json())
      .then(data => {
        setStaff((Array.isArray(data) ? data : []).filter((s: Staff) => s.role !== 'SUPER_ADMIN' || true));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        handleLogin(newPin);
      }
    }
  };

  const handleLogin = async (finalPin?: string) => {
    if (!selected) return;
    setError('');
    const p = finalPin || pin;
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: selected.id, pin: p }),
      });
      
      if (res.ok) {
        const data = await res.json();
        const role = data.staff.role;
        // Redirigir según rol
        if (role === 'MESERO') router.push('/waiter');
        else if (role === 'COCINERO' || role === 'BAR') router.push('/kds');
        else if (role === 'RECEPCION') router.push('/admin');
        else if (role === 'CAJA') router.push('/admin/restaurant/reports');
        else router.push('/admin');
      } else {
        const data = await res.json();
        setError(data.error || 'PIN incorrecto');
        setPin('');
      }
    } catch {
      setError('Error de conexión');
      setPin('');
    }
  };

  const handleBack = () => {
    setSelected(null);
    setPin('');
    setError('');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b88364]" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-[#f0ebe3] tracking-wider">Hangar 5</h1>
          <p className="text-xs text-[#b88364] tracking-[0.3em] uppercase mt-2">El Peñón</p>
        </div>

        {!selected ? (
          /* Selección de usuario */
          <div className="space-y-2">
            <p className="text-xs text-[#f0ebe3]/40 text-center uppercase tracking-widest mb-4">
              ¿Quién eres?
            </p>
            {staff.map(s => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-[#b88364]/10 hover:border-[#b88364]/30 hover:bg-white/8 transition-all text-left"
              >
                <span className="text-2xl">{ROLE_EMOJI[s.role] || '👤'}</span>
                <div>
                  <p className="text-[#f0ebe3] font-medium text-sm">{s.name}</p>
                  <p className="text-[10px] text-[#b88364]/60">{ROLE_LABELS[s.role] || s.role}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Input de PIN */
          <div className="text-center">
            <button onClick={handleBack} className="text-xs text-[#b88364]/50 hover:text-[#b88364] mb-6 block mx-auto">
              ← Cambiar usuario
            </button>
            
            <div className="text-2xl mb-1">{ROLE_EMOJI[selected.role]}</div>
            <p className="text-[#f0ebe3] font-medium mb-1">{selected.name}</p>
            <p className="text-[10px] text-[#b88364]/60 mb-6">{ROLE_LABELS[selected.role]}</p>

            {/* PIN dots */}
            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    pin.length > i
                      ? 'bg-[#b88364] border-[#b88364]'
                      : 'border-[#b88364]/30'
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="text-red-400 text-xs mb-4">{error}</p>
            )}

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <button
                  key={n}
                  onClick={() => handlePinInput(String(n))}
                  disabled={pin.length >= 4}
                  className="aspect-square rounded-xl bg-white/5 border border-[#b88364]/10 hover:bg-white/10 hover:border-[#b88364]/30 text-[#f0ebe3] text-xl font-medium transition-all disabled:opacity-30"
                >
                  {n}
                </button>
              ))}
              <div />
              <button
                onClick={() => handlePinInput('0')}
                disabled={pin.length >= 4}
                className="aspect-square rounded-xl bg-white/5 border border-[#b88364]/10 hover:bg-white/10 hover:border-[#b88364]/30 text-[#f0ebe3] text-xl font-medium transition-all disabled:opacity-30"
              >
                0
              </button>
              <button
                onClick={() => { setPin(''); setError(''); }}
                className="aspect-square rounded-xl bg-white/5 border border-[#b88364]/10 hover:bg-white/10 hover:border-[#b88364]/30 text-[#b88364] text-xs font-medium transition-all"
              >
                ⌫
              </button>
            </div>
          </div>
        )}

        {/* Link to customer login */}
        <div className="mt-8 text-center">
          <a
            href="/ingresar"
            className="text-[#b88364]/50 hover:text-[#b88364] text-xs transition-colors"
          >
            ¿Eres cliente? Ingresa aquí →
          </a>
        </div>
      </div>
    </main>
  );
}
