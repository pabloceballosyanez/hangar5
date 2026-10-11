'use client';

import { useState } from 'react';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';

const FASES = [
  { num: 1, title: 'Electrónica Básica', duration: '2 sesiones (fin de semana)', slug: 'fase-1-electronica', desc: 'Identificar componentes, usar protoboard, conectar sensores I²C, armar circuitos básicos y leer temperatura desde Python.' },
  { num: 2, title: 'Armado del Prototipo', duration: '1 sesión', slug: 'fase-2-prototipo', desc: 'Montar la primera estación completa: Pi + anemómetro + BME280 + panel solar. Escribir el script de lecturas y envío a la API.' },
  { num: 3, title: 'Programación y Servidor', duration: '2 sesiones', slug: 'fase-3-programacion', desc: 'Cómo funciona una API REST, cómo mandar datos a internet y cómo visualizarlos en tiempo real. Python, JSON, HTTP.' },
  { num: 4, title: 'Impermeabilización y Montaje', duration: '1 sesión', slug: 'fase-4-impermeabilizacion', desc: 'Soldar componentes, armar gabinetes estancos, montar mástiles y paneles solares. Probar en exterior real.' },
  { num: 5, title: 'Instalación en Campo', duration: '1 día por estación', slug: 'fase-5-instalacion', desc: 'Subir al launch, medio cerro y LZ. Instalar las estaciones en sus ubicaciones definitivas. Verificar transmisión.' },
  { num: 6, title: 'Monitoreo y Mejora Continua', duration: 'Permanente', slug: 'fase-6-monitoreo', desc: 'Rotar turnos de mantenimiento, limpiar sensores, revisar paneles, resetear. Mejorar con feedback de pilotos.' },
];

const DONATION_AMOUNTS = [
  { label: 'Café solidario', amount: 50 },
  { label: 'Sensor BME280', amount: 200 },
  { label: 'Kit completo', amount: 500 },
  { label: 'Estación entera', amount: 5000 },
];

const MATERIALES = [
  ['Microcomputadora', 'Raspberry Pi Zero 2 W', '~$800'],
  ['Anemómetro + veleta', 'Sparkfun / InSpeed', '~$1,500'],
  ['Sensor temp/hum/presión', 'BME280', '~$150'],
  ['Panel solar 5W', 'Genérico 12V', '~$400'],
  ['Controlador de carga + batería', 'TP4056 + Li-Ion 18650', '~$250'],
  ['Gabinete estanco IP65', 'Caja plástica con prensaestopas', '~$300'],
  ['Mástil + soportes', 'Tubo PVC 2 m + abrazaderas', '~$350'],
  ['Tarjeta microSD 32 GB', 'SanDisk / Kingston', '~$150'],
  ['Módem 4G USB', 'Huawei / ZTE (si no hay WiFi)', '~$500'],
  ['Cables, conectores, tornillos', 'Varios', '~$300'],
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
            Estaciones meteorológicas con Raspberry Pi, construidas por jóvenes de
            El Peñón para que pilotos y comunidad tengan datos en tiempo real desde
            los puntos clave de vuelo. Un curso completo, gratuito y abierto.
          </p>
        </div>
      </section>

      {/* ¿Por qué hacer esto? */}
      <section className="py-32 bg-[#faf7f5]">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">La Visión</p>
          <h2 className="font-serif text-5xl md:text-6xl text-[#1b4235] tracking-[-0.02em] mb-16">
            ¿Por qué hacer esto?
          </h2>

          <div className="space-y-8 text-lg text-[#5c3d2e] leading-relaxed">
            <p>
              Hoy, un piloto que llega al Peñón no tiene forma de saber cómo está el viento
              en el despegue antes de subir. Los pronósticos meteorológicos globales no capturan
              lo que pasa en nuestros valles, con nuestros microclimas, a nuestra altitud.
            </p>
            <p>
              Una <strong className="text-[#1b4235]">red de estaciones meteorológicas</strong> en
              puntos estratégicos — despegue, medio cerro, aterrizaje — cambia eso por completo.
              Datos reales, en tiempo real, desde cualquier celular.
            </p>
            <p>
              Y si quienes las construyen, instalan y mantienen son los{' '}
              <strong className="text-[#1b4235]">jóvenes de El Peñón</strong>,
              el proyecto se transforma: ya no es solo tecnología, es educación, oficio
              y orgullo comunitario.
            </p>
          </div>

          {/* Evidencia científica */}
          <div className="mt-16 p-8 bg-white rounded-lg border border-[#1b4235]/10">
            <h3 className="font-serif text-2xl text-[#1b4235] mb-6">¿Lo respalda la ciencia?</h3>
            <div className="space-y-5 text-sm text-[#5c3d2e] leading-relaxed">
              <p>
                Sí. Múltiples estudios demuestran que una red densa de estaciones meteorológicas
                de bajo costo mejora significativamente los pronósticos locales, sobre todo en
                terrenos complejos como montañas y valles.
              </p>
              <div className="space-y-4 mt-4">
                <div className="border-l-2 border-[#b88364]/40 pl-4">
                  <p className="font-medium text-[#1b4235]">
                    Madaus & Hakim (2014) — <span className="italic">Monthly Weather Review</span>
                  </p>
                  <p className="text-[#5c3d2e]/70 mt-1">
                    Demostraron que las observaciones de presión barométrica de estaciones personales
                    densas mejoran los análisis meteorológicos de mesoescala. Las estaciones ciudadanas
                    pueden llenar huecos donde los modelos globales tienen poca resolución.
                  </p>
                </div>
                <div className="border-l-2 border-[#b88364]/40 pl-4">
                  <p className="font-medium text-[#1b4235]">
                    Muller et al. (2015) — <span className="italic">International Journal of Climatology</span>
                  </p>
                  <p className="text-[#5c3d2e]/70 mt-1">
                    Revisión exhaustiva sobre el uso de ciencia ciudadana y crowdsourcing para
                    ciencias atmosféricas. Concluye que las observaciones ciudadanas son especialmente
                    valiosas en zonas con baja densidad de estaciones oficiales.
                  </p>
                </div>
                <div className="border-l-2 border-[#b88364]/40 pl-4">
                  <p className="font-medium text-[#1b4235]">
                    Meier et al. (2017) — <span className="italic">International Journal of Climatology</span>
                  </p>
                  <p className="text-[#5c3d2e]/70 mt-1">
                    Analizaron datos de temperatura de miles de estaciones meteorológicas ciudadanas
                    en Europa. Demostraron que, con calibración adecuada, estas estaciones alcanzan
                    una precisión comparable a las oficiales para estudios de isla de calor urbana
                    y monitoreo de microclimas.
                  </p>
                </div>
                <div className="border-l-2 border-[#b88364]/40 pl-4">
                  <p className="font-medium text-[#1b4235]">
                    Clark et al. (2020) — <span className="italic">Meteorological Applications</span>
                  </p>
                  <p className="text-[#5c3d2e]/70 mt-1">
                    Estudiaron el uso operacional de observaciones colaborativas en meteorología.
                    Señalan que las redes densas de bajo costo son particularmente útiles para
                    aplicaciones de very short-range forecasting (0–6 horas), justo lo que necesita
                    un piloto antes de despegar.
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[#1b4235] font-medium">
                Adicionalmente, el programa{' '}
                <strong>CWOP (Citizen Weather Observer Program)</strong> envía datos de más de 7,000
                estaciones ciudadanas al sistema MADIS de la NOAA, y estos datos se incorporan
                diariamente en los modelos operacionales de Estados Unidos. El{' '}
                <strong>Raspberry Pi Oracle Weather Station</strong> desplegó casi 1,000 estaciones
                escolares en todo el mundo. No es teoría: se hace, funciona y está documentado.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {[
              { title: 'Educación', text: 'Jóvenes locales aprenden electrónica, programación y meteorología con un proyecto real, tangible y útil para su comunidad.' },
              { title: 'Seguridad', text: 'Pilotos consultan condiciones reales del despegue antes de volar. Información local reduce el riesgo y mejora las decisiones.' },
              { title: 'Comunidad', text: 'El Peñón se vuelve referente regional en monitoreo meteorológico. Datos abiertos para toda la comunidad de vuelo libre.' },
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

          <p className="text-white/60 mb-12 text-lg max-w-3xl">
            Cada estación mide viento (velocidad y dirección), temperatura, humedad y presión
            atmosférica. Se alimenta con panel solar y transmite datos por WiFi o red móvil 4G.
            Los precios son estimados en pesos mexicanos a junio de 2026.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-4 pr-8 text-xs tracking-[0.2em] uppercase text-[#b88364] font-normal">Componente</th>
                  <th className="py-4 pr-8 text-xs tracking-[0.2em] uppercase text-[#b88364] font-normal">Modelo sugerido</th>
                  <th className="py-4 text-right text-xs tracking-[0.2em] uppercase text-[#b88364] font-normal">Costo est.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MATERIALES.map(([comp, model, cost]) => (
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
              <strong className="text-white">Meta inicial:</strong> 3 estaciones — Despegue, Medio Cerro, Aterrizaje.
              <br />
              <strong className="text-white">Presupuesto total estimado:</strong> ~$14,100 MXN en materiales.
              <br />
              <strong className="text-white">Costo por equipo:</strong> Entre 4 y 5 jóvenes por estación.
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
            {FASES.map((fase) => (
              <Link
                key={fase.slug}
                href={`/comunidad/${fase.slug}`}
                className="flex gap-6 p-6 bg-white rounded-lg border border-[#1b4235]/5 hover:shadow-md hover:border-[#b88364]/20 transition-all group block"
              >
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[#b88364]/10 flex items-center justify-center group-hover:bg-[#b88364]/20 transition-colors">
                  <span className="text-[#b88364] text-lg font-bold">{fase.num}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs text-[#b88364] tracking-[0.2em] uppercase">Fase {fase.num}</span>
                    <span className="text-xs text-[#5c3d2e]/40">· {fase.duration}</span>
                  </div>
                  <h3 className="font-serif text-xl text-[#1b4235] mb-2 group-hover:text-[#b88364] transition-colors">
                    {fase.title}
                  </h3>
                  <p className="text-sm text-[#5c3d2e] leading-relaxed">{fase.desc}</p>
                  <span className="inline-flex items-center gap-2 text-xs text-[#b88364] mt-3 tracking-wider uppercase group-hover:translate-x-1 transition-transform">
                    Ver curso completo →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stack de software */}
      <section className="py-32 bg-[#faf7f5]">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">Tecnología</p>
          <h2 className="font-serif text-5xl md:text-6xl text-[#1b4235] tracking-[-0.02em] mb-16">
            Stack de software
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { title: 'Raspberry Pi OS Lite', desc: 'Linux ligero sin entorno gráfico. Corre en microSD, consume muy poca energía. Ideal para operar 24/7 con panel solar.' },
              { title: 'Python 3 + bibliotecas', desc: 'Scripts en Python para leer sensores (smbus2, gpiozero). Toman lecturas cada minuto y las envían como JSON a la API.' },
              { title: 'WeeWX (opcional)', desc: 'Servidor meteorológico de código abierto. Se puede usar si se quiere un panel de control local con gráficas, histórico y reportes.' },
              { title: 'API en hangar5.onrender.com', desc: 'Servidor que recibe los datos de cada estación, los guarda en la base de datos y los muestra en tiempo real a los pilotos.' },
              { title: 'Supervisor / systemd', desc: 'Asegura que el programa de lecturas se reinicie automáticamente si falla. Cero intervención manual.' },
              { title: 'Tablero de control web', desc: 'Página pública con viento, ráfagas, dirección y tendencia de cada punto. Accesible desde cualquier teléfono celular.' },
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
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">Apoya el proyecto</p>
          <h2 className="font-serif text-5xl md:text-6xl tracking-[-0.02em] mb-8">
            Donativos
          </h2>
          <p className="text-white/60 mb-12 leading-relaxed max-w-xl mx-auto">
            Cada peso va directo a componentes para las estaciones. Los jóvenes ponen el talento,
            las ganas y el tiempo. Con tu ayuda ponemos los sensores, las placas y los paneles solares.
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
                <span className="block text-lg font-medium">${item.amount.toLocaleString('es-MX')}</span>
                <span className="block text-xs text-white/50 mt-0.5">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 justify-center mb-12">
            <div className="h-px w-12 bg-white/20" />
            <span className="text-xs text-white/30 uppercase tracking-wider">o elige tu monto</span>
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

      {/* Participá */}
      <section className="py-32 bg-[#faf7f5]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">¿Eres de El Peñón?</p>
          <h2 className="font-serif text-5xl md:text-6xl text-[#1b4235] tracking-[-0.02em] mb-8">
            Participa
          </h2>
          <p className="text-lg text-[#5c3d2e] leading-relaxed mb-12 max-w-xl mx-auto">
            Si vives en El Peñón, Temascaltepec o alrededores, y tienes entre 13 y 25 años,
            este proyecto es para ti. No necesitas saber nada: te enseñamos todo.
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
              Correo electrónico
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
