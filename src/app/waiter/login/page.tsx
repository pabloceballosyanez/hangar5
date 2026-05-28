'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WaiterLoginPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/login'); }, [router]);
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <p className="text-white/50">Redirigiendo al login...</p>
    </div>
  );
}
