'use client';

import { useState } from 'react';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';

const DONATION_AMOUNTS = [
  { label: 'Café solidario', amount: 50 },
  { label: 'Sensor BME280', amount: 200 },
  { label: 'Kit completo', amount: 500 },
  { label: 'Estación entera', amount: 5000 },
];

export default function ComunidadPage() {
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDonate = async (amount: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Error al crear donativo');
      }
    } catch {
      setError('No se pudo conectar con la pasarela de pago');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDonate = () => {
    const amt = parseInt(customAmount, 10);
    if (!amt || amt < 50) {
      setError('Monto mínimo: $50 MXN');
      return;
    }
    handleDonate(amt);
  };

  return (
    <main className="min-h-screen bg-[#faf7f5]">
      <LandingNav />

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-[#1b4235]">
        <div className="absolute inset-0 opacity-20 bg-[url('/img/paisaje.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-[#1b4235]" />
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-6">Comunidad</p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.1] mb-8 tracking-[-0.02em]">
            Red Meteorológica<br />
            <span className="italic">Comunitaria</span>
          </h1>
          <p className="text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto opacity-80">
            Estaciones DIY con Raspberry Pi construidas por jóvenes de El Peñón
            para que pilotos y comunidad tengan datos meteorológicos en tiempo real
            desde los puntos clave de vuelo.
          </p>
        </div>
      </section>

      {/* La Visión */}
      <section className="py-32 bg-[#faf7f5]">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">La Visión</p>
          <h2 className="font-serif text-5xl md:text-6xl text-[#1b4235] tracking-[-0.02em] mb-16">
            ¿Por qué hacer esto?
          </h2>

          <div className="space-y-8 text-lg text-[#5c3d2e] leading-relaxed">
            <p>
              Hoy, un piloto que llega al Peñón no tiene forma de saber cómo está el viento
              en el launch antes de subir. Las predicciones meteorológicas globales no capturan
              lo que pasa en nuestros valles, con nuestros microclimas, a nuestra altitud.
            </p>
            <p>
              Una <strong className="text-[#1b4235]">red de estaciones meteorológicas</strong> en
              puntos estratégicos — launch, medio cerro, aterrizaje — cambia eso por completo.
              Datos reales, en tiempo real, accesibles desde el celular.
            </p>
            <p>
              Y si quienes las construyen, instalan y mantienen son los <strong className="text-[#1b4235]">
              jóvenes de El Peñón</strong>, el proyecto se transforma: ya no es solo tecnología,
              es educación, oficio y orgullo comunitario.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-20">
            {[
              { title: 'Educación', text: 'Jóvenes locales aprenden electrónica, programación y meteorología con un proyecto real.' },
              { title: 'Seguridad', text: 'Pilotos consultan condiciones reales del launch antes de despegar. Menos riesgo, mejores vuelos.' },
              { title: 'Comunidad', text: 'El Peñón se vuelve referente en monitoreo meteorológico. Datos abiertos para todos.' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-8 rounded-lg border border-[#1b4235]/5 hover:shadow-lg transition-shadow">
                <h3 className="font-serif text-xl text-[#1b4235] mb-3">{item.title}</h3>
                <p className="text-[#5c3d2e] leading-relaxed text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Materiales */}
      <section className="py-32 bg-[#1b4235] text-white">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">Componentes</p>
          <h2 className="font-serif text-5xl md:text-6xl tracking-[-0.02em] mb-16">
            Materiales por estación
          </h2>

          <p className="text-white/60 mb-12 text-lg">
            Cada estación mide viento (velocidad + dirección), temperatura, humedad y presión atmosférica.
            Se alimenta con panel solar y transmite datos por WiFi o red móvil 4G.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-4 pr-8 text-xs tracking-[0.2em] uppercase text-[#b88364] font-normal">Componente</th>
                  <th className="py-4 pr-8 text-xs tracking-[0.2em] uppercase text-[#b88364] font-normal">Modelo</th>
                  <th className="py-4 text-right text-xs tracking-[0.2em] uppercase text-[#b88364] font-normal">Costo est.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ['Microcomputadora', 'Raspberry Pi Zero 2 W', '~$800'],
                  ['Anemómetro + veleta', 'Sparkfun / InSpeed', '~$1,500'],
                  ['Sensor temp/hum/presión', 'BME280', '~$150'],
                  ['Panel solar 5W', 'Genérico', '~$400'],
                  ['Controlador carga solar', 'TP4056 + batería Li-Ion', '~$250'],
                  ['Gabinete estanco IP65', 'Caja plástica', '~$300'],
                  ['Mástil + soportes', 'Tubo PVC 2m + abrazaderas', '~$350'],
                  ['Tarjeta microSD 32GB', 'SanDisk / Kingston', '~$150'],
                  ['Módem 4G USB', 'Huawei / ZTE (si no hay WiFi)', '~$500'],
                  ['Cables, conectores, tornillos', 'Varios', '~$300'],
                ].map(([comp, model, cost]) => (
                  <tr key={comp} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 pr-8 text-sm">{comp}</td>
                    <td className="py-4 pr-8 text-sm text-white/50">{model}</td>
                    <td className="py-4 text-right text-sm font-medium">{cost}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#b88364]/40">
                  <td className="py-6 pr-8 text-lg font-serif" colSpan={2}>Total por estación</td>
                  <td className="py-6 text-right text-lg font-serif">~$4,700 MXN</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-12 p-6 bg-white/5 rounded-lg border border-white/10">
            <p className="text-sm text-white/70">
              <strong className="text-white">Meta inicial:</strong> 3 estaciones — Launch, Medio Cerro, LZ.
              <br />
              <strong className="text-white">Presupuesto total:</strong> ~$14,100 MXN en materiales.
            </p>
          </div>
        </div>
      </section>

      {/* Plan de Trabajo */}
      <section className="py-32 bg-[#faf7f5]">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">Cronograma</p>
          <h2 className="font-serif text-5xl md:text-6xl text-[#1b4235] tracking-[-0.02em] mb-16">
            Plan de trabajo
          </h2>

          <div className="space-y-6">
            {[
              {
                phase: 'Fase 1',
                title: 'Taller de Electrónica Básica',
                duration: '2 sesiones (fin de semana)',
                desc: 'Los chavos aprenden a identificar componentes, usar protoboard, conectar sensores I²C, y armar circuitos básicos. Cada quien conecta su BME280 a la Raspberry Pi y lee temperatura en Python.',
              },
              {
                phase: 'Fase 2',
                title: 'Armado del Prototipo',
                duration: '1 sesión',
                desc: 'Montamos la primera estación completa sobre protoboard: Pi + anemómetro + BME280 + panel solar. Escribimos el script que toma lecturas cada minuto y las envía a una API.',
              },
              {
                phase: 'Fase 3',
                title: 'Programación y Servidor',
                duration: '2 sesiones',
                desc: 'Los chavos aprenden cómo funciona una API REST, cómo se mandan datos a internet, y cómo se visualizan en hangar5.onrender.com. Conceptos de Python, JSON, HTTP.',
              },
              {
                phase: 'Fase 4',
                title: 'Impermeabilización y Montaje',
                duration: '1 sesión',
                desc: 'Soldamos componentes en placa perforada, armamos gabinetes estancos, montamos mástiles y paneles solares. Probamos en exterior real.',
              },
              {
                phase: 'Fase 5',
                title: 'Instalación en Campo',
                duration: '1 día por estación',
                desc: 'Subimos al launch, medio cerro y LZ. Instalamos las 3 estaciones en sus ubicaciones definitivas. Verificamos transmisión de datos.',
              },
              {
                phase: 'Fase 6',
                title: 'Monitoreo y Mejora Continua',
                duration: 'Permanente',
                desc: 'Los chavos rotan turnos de mantenimiento (limpiar sensores, revisar paneles, resetear). Mejoramos el software con feedback de pilotos. Agregamos más estaciones.',
              },
            ].map((item) => (
              <div key={item.phase} className="flex gap-6 p-6 bg-white rounded-lg border border-[#1b4235]/5 hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[#b88364]/10 flex items-center justify-center">
                  <span className="text-[#b88364] text-sm font-bold">{item.phase.split(' ')[1]}</span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs text-[#b88364] tracking-[0.2em] uppercase">{item.phase}</span>
                    <span className="text-xs text-[#5c3d2e]/40">· {item.duration}</span>
                  </div>
                  <h3 className="font-serif text-xl text-[#1b4235] mb-2">{item.title}</h3>
                  <p className="text-sm text-[#5c3d2e] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Software Stack */}
      <section className="py-32 bg-[#faf7f5]">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">Tecnología</p>
          <h2 className="font-serif text-5xl md:text-6xl text-[#1b4235] tracking-[-0.02em] mb-16">
            Stack de software
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { title: 'Raspberry Pi OS Lite', desc: 'Linux ligero sin interfaz gráfica. Corre en microSD, consume casi nada. Ideal para correr 24/7 con panel solar.' },
              { title: 'Python + bibliotecas', desc: 'Scripts en Python 3 para leer sensores (smbus2, gpiozero), tomar lecturas cada minuto y enviarlas como JSON a la API.' },
              { title: 'WeeWX', desc: 'Servidor meteorológico open source. Opcional si se quiere dashboard local con gráficos, histórico y reportes.' },
              { title: 'API en hangar5.onrender.com', desc: 'Endpoint que recibe los datos de cada estación, los guarda en base de datos y los muestra en tiempo real a pilotos.' },
              { title: 'Supervisor / systemd', desc: 'Asegura que el script de lecturas se reinicie automáticamente si falla. Cero intervención manual.' },
              { title: 'Dashboard web', desc: 'Página pública con viento, ráfagas, dirección y tendencia de cada punto. Accesible desde cualquier celular.' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-6 rounded-lg border border-[#1b4235]/5">
                <h3 className="font-serif text-lg text-[#1b4235] mb-2">{item.title}</h3>
                <p className="text-sm text-[#5c3d2e] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Donativos */}
      <section id="donar" className="py-32 bg-[#1b4235] text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">Apoyá el proyecto</p>
          <h2 className="font-serif text-5xl md:text-6xl tracking-[-0.02em] mb-8">
            Donativos
          </h2>
          <p className="text-white/60 mb-12 leading-relaxed max-w-xl mx-auto">
            Cada peso va directo a componentes para las estaciones. Los chavos ponen el talento,
            las ganas y el tiempo. Con tu ayuda ponemos los sensores, las placas y los paneles.
          </p>

          {error && (
            <p className="text-red-400 text-sm mb-6">{error}</p>
          )}

          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {DONATION_AMOUNTS.map((item) => (
              <button
                key={item.amount}
                onClick={() => handleDonate(item.amount)}
                disabled={loading}
                className="px-6 py-3 rounded-full border border-white/20 hover:border-[#b88364] hover:bg-[#b88364]/10 transition-all duration-300 disabled:opacity-50"
              >
                <span className="block text-lg font-medium">${item.amount}</span>
                <span className="block text-xs text-white/50 mt-0.5">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 justify-center mb-12">
            <div className="h-px w-12 bg-white/20" />
            <span className="text-xs text-white/30 uppercase tracking-wider">o elegí tu monto</span>
            <div className="h-px w-12 bg-white/20" />
          </div>

          <div className="flex gap-3 justify-center">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
              <input
                type="number"
                min="50"
                placeholder="500"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-full pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#b88364] w-40 text-center"
              />
            </div>
            <button
              onClick={handleCustomDonate}
              disabled={loading || !customAmount}
              className="px-8 py-3 bg-[#b88364] hover:bg-[#a07550] rounded-full text-sm tracking-widest uppercase font-semibold transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Redirigiendo...' : 'Donar'}
            </button>
          </div>

          <p className="text-white/20 text-xs mt-8">
            Pagos seguros a través de Mercado Pago
          </p>
        </div>
      </section>

      {/* CTA Participar */}
      <section className="py-32 bg-[#faf7f5]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">¿Sos del Peñón?</p>
          <h2 className="font-serif text-5xl md:text-6xl text-[#1b4235] tracking-[-0.02em] mb-8">
            Participá
          </h2>
          <p className="text-lg text-[#5c3d2e] leading-relaxed mb-12 max-w-xl mx-auto">
            Si vivís en El Peñón, Temascaltepec, o alrededores, y tenés entre 13 y 25 años,
            este proyecto es para vos. No necesitás saber nada — te enseñamos todo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/527224556628?text=Hola%2C%20quiero%20participar%20en%20la%20Red%20Meteorol%C3%B3gica%20Comunitaria%20de%20El%20Pe%C3%B1%C3%B3n"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#25D366] hover:bg-[#1fb855] text-white rounded-lg text-sm tracking-widest uppercase font-semibold transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <a
              href="mailto:hangar.cinco.mexico@gmail.com?subject=Quiero%20participar%20en%20la%20Red%20Meteorol%C3%B3gica"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-[#1b4235]/20 hover:border-[#b88364] hover:bg-[#b88364]/5 text-[#1b4235] rounded-lg text-sm tracking-widest uppercase font-semibold transition-all duration-300"
            >
              Email
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f2a20] text-white/30 py-12 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs tracking-[0.3em] uppercase mb-2">Hangar 5 · Comunidad</p>
          <p className="text-xs">
            <Link href="/" className="hover:text-white/60 transition-colors">Inicio</Link>
            {' · '}
            El Peñón, Temascaltepec · © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </main>
  );
}
