'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STAFF = [
  { id: 'carlos', name: 'Carlos', emoji: '🧑‍🍳', pin: '1234', role: 'Mesero' },
  { id: 'luis',   name: 'Luis',   emoji: '👨‍🍽️',  pin: '5678', role: 'Mesero' },
];

export default function WaiterLoginPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<typeof STAFF[0] | null>(null);
  const [pin, setPin]           = useState('');
  const [error, setError]       = useState('');
  const [shaking, setShaking]   = useState(false);

  const shake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  };

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError('');

    if (next.length === 4) {
      if (selected && next === selected.pin) {
        sessionStorage.setItem('waiterId',   selected.id);
        sessionStorage.setItem('waiterName', selected.name);
        router.push('/waiter');
      } else {
        shake();
        setTimeout(() => {
          setPin('');
          setError('PIN incorrecto. Intenta de nuevo.');
        }, 500);
      }
    }
  };

  const handleBackspace = () => {
    setPin(p => p.slice(0, -1));
    setError('');
  };

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 py-10">
      {/* Brand */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-black tracking-tight text-white">Hangar 5</h1>
        <p className="text-amber-400 text-sm mt-1 tracking-widest uppercase">Mesero</p>
      </div>

      <div className="w-full max-w-xs">
        {!selected ? (
          /* ── Staff selector ── */
          <>
            <p className="text-slate-400 text-sm text-center mb-5">¿Quién eres?</p>
            <div className="grid grid-cols-2 gap-4">
              {STAFF.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelected(s); setPin(''); setError(''); }}
                  className="flex flex-col items-center gap-3 py-8 px-4 bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-amber-400/60 rounded-2xl transition-all active:scale-95"
                >
                  <span className="text-5xl leading-none">{s.emoji}</span>
                  <div className="text-center">
                    <p className="font-bold text-white text-xl">{s.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          /* ── PIN entry ── */
          <>
            {/* Back / who */}
            <button
              onClick={() => { setSelected(null); setPin(''); setError(''); }}
              className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
            >
              <span className="text-lg">←</span>
              <span className="text-sm">{selected.emoji} {selected.name}</span>
            </button>

            <p className="text-slate-400 text-sm text-center mb-6">Ingresa tu PIN de 4 dígitos</p>

            {/* PIN dots */}
            <div
              className={`flex justify-center gap-5 mb-3 ${shaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
              style={{ animation: shaking ? 'shake 0.5s ease-in-out' : undefined }}
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                    i < pin.length
                      ? 'bg-amber-400 border-amber-400 scale-110'
                      : 'border-slate-600'
                  }`}
                />
              ))}
            </div>

            {/* Error */}
            <div className="h-6 flex items-center justify-center mb-4">
              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
            </div>

            {/* Numeric keypad */}
            <div className="grid grid-cols-3 gap-3">
              {keys.map((k, i) => {
                if (k === '') return <div key={i} />;
                return (
                  <button
                    key={i}
                    onClick={() => k === '⌫' ? handleBackspace() : handleDigit(k)}
                    className={`h-14 rounded-xl font-bold text-xl active:scale-95 transition-all select-none ${
                      k === '⌫'
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-300 text-2xl'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    }`}
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
