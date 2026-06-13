import Link from 'next/link';
import CursoNav from '../CursoNav';

export const metadata = {
  title: 'Fase 3: Programación y Servidor — Red Meteorológica Comunitaria',
  description: 'Aprende cómo funciona internet, APIs REST, cómo enviar datos desde la Pi a un servidor y cómo visualizarlos en tiempo real con una página web.',
};

export default function Fase3Page() {
  return (
    <main className="min-h-screen bg-[#faf7f5]">
      <CursoNav fase={3} />

      {/* Hero */}
      <section className="relative py-32 bg-[#1b4235] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/img/paisaje.jpg')] bg-cover bg-center" />
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">Fase 3 · 2 sesiones</p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.1] mb-6 tracking-[-0.02em]">
            Programación<br /><span className="italic">y Servidor</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Tus sensores ya leen datos. Ahora vamos a mandarlos a internet y mostrarlos en
            una página web para que cualquier piloto los consulte en tiempo real desde su celular.
          </p>
        </div>
      </section>

      {/* Objetivos */}
      <section className="py-20 bg-[#faf7f5]">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">Objetivos</p>
          <h2 className="font-serif text-4xl text-[#1b4235] tracking-[-0.02em] mb-10">
            Lo que aprenderás
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Entender qué es internet y cómo se comunican las computadoras entre sí',
              'Comprender qué es una API REST y cómo funciona el protocolo HTTP',
              'Diferenciar entre métodos GET y POST y cuándo usar cada uno',
              'Entender el formato JSON y por qué es el estándar para APIs',
              'Escribir un programa en Python que envíe datos meteorológicos a internet',
              'Implementar reintentos y manejo de errores en el envío de datos',
              'Usar un servidor de prueba (webhook.site) para verificar que los datos llegan',
              'Crear tu propia página web que muestre los datos meteorológicos en vivo',
              'Entender cómo fetch() obtiene datos de una API desde JavaScript',
              'Conocer el tablero de control final y cómo interpretarlo',
            ].map((obj, i) => (
              <div key={i} className="flex gap-3 p-4 bg-white rounded-lg border border-[#1b4235]/5">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold">{i + 1}</span>
                <p className="text-sm text-[#5c3d2e] leading-relaxed">{obj}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Materiales para esta fase */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">Materiales</p>
          <h2 className="font-serif text-4xl text-[#1b4235] tracking-[-0.02em] mb-10">
            ¿Qué necesitas para esta fase?
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1b4235]/10">
                  <th className="py-4 pr-8 text-xs tracking-[0.2em] uppercase text-[#b88364] font-normal">Cantidad</th>
                  <th className="py-4 pr-8 text-xs tracking-[0.2em] uppercase text-[#b88364] font-normal">Material</th>
                  <th className="py-4 text-right text-xs tracking-[0.2em] uppercase text-[#b88364] font-normal">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b4235]/5">
                {[
                  ['1', 'Raspberry Pi con BME280 conectado', 'De la Fase 1'],
                  ['1', 'Computadora con editor de código', 'VS Code recomendado'],
                  ['1', 'Conexión a internet (WiFi)', 'La Pi debe tener WiFi'],
                  ['1', 'Navegador web', 'Chrome, Firefox o Edge'],
                ].map(([cant, mat, notas]) => (
                  <tr key={mat} className="hover:bg-[#faf7f5] transition-colors">
                    <td className="py-4 pr-8 text-sm text-[#1b4235] font-medium">{cant}</td>
                    <td className="py-4 pr-8 text-sm text-[#5c3d2e]">{mat}</td>
                    <td className="py-4 text-right text-sm text-[#5c3d2e]/60">{notas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Contenido del curso */}
      <section className="py-20 bg-[#faf7f5]">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">Contenido</p>
          <h2 className="font-serif text-4xl text-[#1b4235] tracking-[-0.02em] mb-16">
            Paso a paso
          </h2>

          {/* Sesión 1 */}
          <div className="mb-20">
            <h3 className="font-serif text-3xl text-[#1b4235] mb-8">Sesión 1: Cómo funciona internet</h3>
            
            <div className="space-y-12">
              {/* Paso 1 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">1</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">¿Qué es una API REST?</h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    Imagina que estás en un restaurante. Tú (el <strong>cliente</strong>) pides un platillo al
                    mesero. El mesero lleva tu pedido a la <strong>cocina</strong> (el servidor) y regresa con tu
                    comida. Así funciona internet: tu programa (cliente) le pide datos a otro programa (servidor),
                    y el servidor responde con la información.
                  </p>
                  <p>
                    Una <strong>API REST</strong> (Application Programming Interface, estilo Representational
                    State Transfer) es la forma moderna de hacer esa comunicación. Funciona con el protocolo
                    <strong> HTTP</strong> — el mismo que usa tu navegador para cargar páginas web.
                  </p>

                  <div className="bg-white p-6 rounded-lg border border-[#1b4235]/10">
                    <p className="font-medium text-[#1b4235] mb-3">📌 Los verbos HTTP más importantes</p>
                    <div className="space-y-3 text-sm">
                      <div className="flex gap-3">
                        <span className="flex-shrink-0 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-bold font-mono">GET</span>
                        <div>
                          <p className="text-[#1b4235] font-medium">Obtener datos del servidor</p>
                          <p className="text-[#5c3d2e]/60">Ejemplo: pedir la temperatura actual. Como cuando entras a un sitio web.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="flex-shrink-0 px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-bold font-mono">POST</span>
                        <div>
                          <p className="text-[#1b4235] font-medium">Enviar datos al servidor</p>
                          <p className="text-[#5c3d2e]/60">Ejemplo: mandar una lectura del sensor. Como cuando llenas un formulario.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="flex-shrink-0 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-bold font-mono">PUT</span>
                        <div>
                          <p className="text-[#1b4235] font-medium">Actualizar datos que ya existen</p>
                          <p className="text-[#5c3d2e]/60">Ejemplo: corregir una lectura errónea.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="flex-shrink-0 px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-bold font-mono">DELETE</span>
                        <div>
                          <p className="text-[#1b4235] font-medium">Borrar datos</p>
                          <p className="text-[#5c3d2e]/60">Ejemplo: eliminar una lectura vieja.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p>
                    Los datos viajan en formato <strong>JSON</strong> (JavaScript Object Notation). Es un formato
                    de texto simple que tanto humanos como máquinas pueden leer fácilmente. Se ve así:
                  </p>

                  <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-white/50">{'{'}</p>
                    <p className="text-white ml-4"><span className="text-[#edd3c5]">"station"</span>: <span className="text-[#b88364]">"launch"</span>,</p>
                    <p className="text-white ml-4"><span className="text-[#edd3c5]">"temp"</span>: <span className="text-[#b88364]">22.3</span>,</p>
                    <p className="text-white ml-4"><span className="text-[#edd3c5]">"humidity"</span>: <span className="text-[#b88364]">54.7</span>,</p>
                    <p className="text-white ml-4"><span className="text-[#edd3c5]">"pressure"</span>: <span className="text-[#b88364]">781.2</span>,</p>
                    <p className="text-white ml-4"><span className="text-[#edd3c5]">"wind_speed"</span>: <span className="text-[#b88364]">12.5</span>,</p>
                    <p className="text-white ml-4"><span className="text-[#edd3c5]">"wind_dir"</span>: <span className="text-[#b88364]">180</span>,</p>
                    <p className="text-white ml-4"><span className="text-[#edd3c5]">"battery"</span>: <span className="text-[#b88364]">3.9</span></p>
                    <p className="text-white/50">{'}'}</p>
                  </div>

                  <div className="bg-[#edd3c5]/30 p-6 rounded-lg border border-[#b88364]/20">
                    <p className="font-medium text-[#1b4235] mb-2">🧠 ¿Qué significa cada campo?</p>
                    <div className="space-y-1 text-sm text-[#5c3d2e]">
                      <p><strong>station:</strong> Identificador de la estación (&quot;launch&quot;, &quot;midhill&quot;, &quot;lz&quot;)</p>
                      <p><strong>temp:</strong> Temperatura en grados Celsius (°C)</p>
                      <p><strong>humidity:</strong> Humedad relativa en porcentaje (%)</p>
                      <p><strong>pressure:</strong> Presión atmosférica en hectopascales (hPa)</p>
                      <p><strong>wind_speed:</strong> Velocidad del viento en kilómetros por hora (km/h)</p>
                      <p><strong>wind_dir:</strong> Dirección del viento en grados (0 = Norte, 90 = Este, 180 = Sur, 270 = Oeste)</p>
                      <p><strong>battery:</strong> Voltaje de la batería (V). Cuando baja de 3.3V, hay que revisar el panel solar.</p>
                    </div>
                  </div>

                  <p>Probemos cómo funciona una API REST usando curl, una herramienta que viene en tu computadora:</p>

                  <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-[#b88364] mb-3"># Abre una Terminal en tu computadora (no en la Pi) y prueba:</p>
                    <p className="text-white/50 mt-2"># GET: Pide los datos actuales de la estación launch</p>
                    <p className="text-white">curl https://hangar5.onrender.com/api/weather/launch</p>
                    <p className="text-white/70 mt-3"># Respuesta (ejemplo):</p>
                    <p className="text-white/70">{'{'}&quot;station&quot;:&quot;launch&quot;,&quot;temp&quot;:22.3,&quot;humidity&quot;:54.7,...{'}'}</p>
                    <p className="text-white/50 mt-4"># GET: Pide todas las estaciones</p>
                    <p className="text-white">curl https://hangar5.onrender.com/api/weather</p>
                    <p className="text-white/50 mt-4"># POST: Envía datos de prueba (esto no se guardará realmente,</p>
                    <p className="text-white/50"># es solo para entender la idea — en la Sesión 2 lo harás de verdad)</p>
                    <p className="text-white">curl -X POST https://hangar5.onrender.com/api/weather \</p>
                    <p className="text-white ml-4">-H &quot;Content-Type: application/json&quot; \</p>
                    <p className="text-white ml-4">-d {'\u0027\u007b'}&quot;station&quot;:&quot;launch&quot;,&quot;temp&quot;:22.3,&quot;humidity&quot;:54.7{'\u007d\u0027'}</p>
                  </div>

                  <div className="bg-[#edd3c5]/30 p-4 rounded-lg border border-[#b88364]/20">
                    <p className="text-sm text-[#5c3d2e]">
                      <strong>💡 Tip:</strong> Los parámetros clave del curl son <code>-X</code> (método HTTP),
                      <code>-H</code> (encabezados o headers) y <code>-d</code> (datos o body).
                      El encabezado <code>Content-Type: application/json</code> le dice al servidor que
                      los datos que envías están en formato JSON.
                    </p>
                  </div>
                </div>
              </div>

              {/* Paso 2 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">2</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">Crear el script de envío en la Pi</h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    Ahora vamos a escribir el programa que corre en la Raspberry Pi, lee los sensores
                    y envía los datos al servidor <strong>automáticamente, cada minuto, para siempre</strong>.
                  </p>
                  <p>
                    Necesitamos instalar la biblioteca <strong>requests</strong> en la Pi, que es la
                    forma más fácil de hacer peticiones HTTP desde Python:
                  </p>
                  <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-[#b88364] mb-3"># Conectado por SSH a tu Raspberry Pi:</p>
                    <p className="text-white">sudo pip3 install requests --break-system-packages</p>
                    <p className="text-white/70 mt-2"># Si ya instalaste smbus2 y bme280 en la Fase 1,</p>
                    <p className="text-white/70"># ya tienes todo lo necesario.</p>
                  </div>

                  <p>Ahora crea el archivo <code>enviar_datos.py</code>:</p>
                  <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-[#b88364] mb-3"># Crea el archivo en la Pi</p>
                    <p className="text-white">nano enviar_datos.py</p>
                    <p className="text-white/70 mt-2"># Pega este código completo:</p>
                    <p className="text-white mt-4"><span className="text-white/50">#!/usr/bin/env python3</span></p>
                    <p className="text-white"><span className="text-white/50">&quot;&quot;&quot;</span></p>
                    <p className="text-white"><span className="text-white/50">enviar_datos.py — Estación Meteorológica Hangar 5</span></p>
                    <p className="text-white"><span className="text-white/50">Lee los sensores y envía los datos al servidor cada 60 segundos.</span></p>
                    <p className="text-white"><span className="text-white/50">Ejecutar: python3 enviar_datos.py</span></p>
                    <p className="text-white"><span className="text-white/50">&quot;&quot;&quot;</span></p>
                    <p className="text-white mt-3"><span className="text-[#b88364]">import</span> smbus2</p>
                    <p className="text-white"><span className="text-[#b88364]">import</span> bme280</p>
                    <p className="text-white"><span className="text-[#b88364]">import</span> requests</p>
                    <p className="text-white"><span className="text-[#b88364]">import</span> time</p>
                    <p className="text-white"><span className="text-[#b88364]">import</span> json</p>
                    <p className="text-white mt-4"><span className="text-white/50"># ─── Configuración ───────────────────────────────────────────</span></p>
                    <p className="text-white mt-2">STATION_ID = <span className="text-[#edd3c5]">&quot;launch&quot;</span>          <span className="text-white/50"># Cambia por: &quot;launch&quot;, &quot;midhill&quot; o &quot;lz&quot;</span></p>
                    <p className="text-white">API_URL = <span className="text-[#edd3c5]">&quot;https://hangar5.onrender.com/api/weather&quot;</span></p>
                    <p className="text-white">INTERVALO = <span className="text-[#b88364]">60</span>               <span className="text-white/50"># Segundos entre cada envío</span></p>
                    <p className="text-white">MAX_REINTENTOS = <span className="text-[#b88364]">3</span>          <span className="text-white/50"># Intentos máximos si falla el envío</span></p>
                    <p className="text-white mt-4"><span className="text-white/50"># ─── Inicializar el sensor BME280 ───────────────────────────</span></p>
                    <p className="text-white mt-2"><span className="text-[#b88364]">def</span> <span className="text-[#edd3c5]">iniciar_sensor</span>():</p>
                    <p className="text-white ml-4"><span className="text-white/50">&quot;&quot;&quot;Conecta al sensor BME280 por I²C y devuelve sus parámetros.&quot;&quot;&quot;</span></p>
                    <p className="text-white ml-4"><span className="text-[#b88364]">try</span>:</p>
                    <p className="text-white ml-8">bus = smbus2.SMBus(1)</p>
                    <p className="text-white ml-8">calibracion = bme280.load_calibration_params(bus, 0x76)</p>
                    <p className="text-white ml-8">print(<span className="text-[#edd3c5]">&quot;✅ Sensor BME280 inicializado&quot;</span>)</p>
                    <p className="text-white ml-8"><span className="text-[#b88364]">return</span> bus, calibracion</p>
                    <p className="text-white ml-4"><span className="text-[#b88364]">except</span> Exception <span className="text-[#b88364]">as</span> e:</p>
                    <p className="text-white ml-8">print(<span className="text-[#edd3c5]">f&quot;❌ Error al iniciar sensor: {'{'}e{'}'}&quot;</span>)</p>
                    <p className="text-white ml-8"><span className="text-[#b88364]">return</span> None, None</p>
                    <p className="text-white mt-4"><span className="text-white/50"># ─── Leer datos del sensor ─────────────────────────────────</span></p>
                    <p className="text-white mt-2"><span className="text-[#b88364]">def</span> <span className="text-[#edd3c5]">leer_sensor</span>(bus, calibracion):</p>
                    <p className="text-white ml-4"><span className="text-white/50">&quot;&quot;&quot;Lee temperatura, humedad y presión del BME280.&quot;&quot;&quot;</span></p>
                    <p className="text-white ml-4"><span className="text-[#b88364]">try</span>:</p>
                    <p className="text-white ml-8">datos = bme280.sample(bus, 0x76, calibracion)</p>
                    <p className="text-white ml-8"><span className="text-[#b88364]">return</span> {'{'}</p>
                    <p className="text-white ml-12"><span className="text-[#edd3c5]">&quot;temp&quot;</span>: round(datos.temperature, 1),</p>
                    <p className="text-white ml-12"><span className="text-[#edd3c5]">&quot;humidity&quot;</span>: round(datos.humidity, 1),</p>
                    <p className="text-white ml-12"><span className="text-[#edd3c5]">&quot;pressure&quot;</span>: round(datos.pressure, 1),</p>
                    <p className="text-white ml-8">{'}'}</p>
                    <p className="text-white ml-4"><span className="text-[#b88364]">except</span> Exception <span className="text-[#b88364]">as</span> e:</p>
                    <p className="text-white ml-8">print(<span className="text-[#edd3c5]">f&quot;❌ Error al leer sensor: {'{'}e{'}'}&quot;</span>)</p>
                    <p className="text-white ml-8"><span className="text-[#b88364]">return</span> None</p>
                    <p className="text-white mt-4"><span className="text-white/50"># ─── Enviar datos al servidor ──────────────────────────────</span></p>
                    <p className="text-white mt-2"><span className="text-[#b88364]">def</span> <span className="text-[#edd3c5]">enviar_datos</span>(datos):</p>
                    <p className="text-white ml-4"><span className="text-white/50">&quot;&quot;&quot;Envía el JSON al servidor. Reintenta hasta MAX_REINTENTOS veces.&quot;&quot;&quot;</span></p>
                    <p className="text-white ml-4">payload = {'{'}<span className="text-[#edd3c5]">&quot;station&quot;</span>: STATION_ID, **datos{'}'}</p>
                    <p className="text-white ml-4 mt-2"><span className="text-[#b88364]">for</span> intento <span className="text-[#b88364]">in</span> range(1, MAX_REINTENTOS + 1):</p>
                    <p className="text-white ml-8"><span className="text-[#b88364]">try</span>:</p>
                    <p className="text-white ml-12">respuesta = requests.post(</p>
                    <p className="text-white ml-16">API_URL,</p>
                    <p className="text-white ml-16">json=payload,        <span className="text-white/50"># requests convierte el dict a JSON automáticamente</span></p>
                    <p className="text-white ml-16">timeout=10           <span className="text-white/50"># Si no responde en 10 segundos, aborta</span></p>
                    <p className="text-white ml-12">)</p>
                    <p className="text-white ml-12"><span className="text-[#b88364]">if</span> respuesta.status_code == 200:</p>
                    <p className="text-white ml-16">print(<span className="text-[#edd3c5]">f&quot;✅ Datos enviados: {'{'}payload{'}'}&quot;</span>)</p>
                    <p className="text-white ml-16"><span className="text-[#b88364]">return</span> True</p>
                    <p className="text-white ml-12"><span className="text-[#b88364]">else</span>:</p>
                    <p className="text-white ml-16">print(<span className="text-[#edd3c5]">f&quot;⚠️  Servidor respondió {'{'}respuesta.status_code{'}'}&quot;</span>)</p>
                    <p className="text-white ml-8"><span className="text-[#b88364]">except</span> requests.exceptions.Timeout:</p>
                    <p className="text-white ml-12">print(<span className="text-[#edd3c5]">f&quot;⚠️  Timeout {'(intento {intento}/{MAX_REINTENTOS})'}&quot;</span>)</p>
                    <p className="text-white ml-8"><span className="text-[#b88364]">except</span> requests.exceptions.ConnectionError:</p>
                    <p className="text-white ml-12">print(<span className="text-[#edd3c5]">f&quot;⚠️  Sin conexión {'(intento {intento}/{MAX_REINTENTOS})'}&quot;</span>)</p>
                    <p className="text-white ml-8"><span className="text-[#b88364]">except</span> Exception <span className="text-[#b88364]">as</span> e:</p>
                    <p className="text-white ml-12">print(<span className="text-[#edd3c5]">f&quot;⚠️  Error: {'{e} (intento {intento}/{MAX_REINTENTOS})'}&quot;</span>)</p>
                    <p className="text-white ml-8 mt-2"><span className="text-white/50"># Espera antes de reintentar (1s, 2s, 4s...)</span></p>
                    <p className="text-white ml-8"><span className="text-[#b88364]">if</span> intento &lt; MAX_REINTENTOS:</p>
                    <p className="text-white ml-12">time.sleep(intento)  <span className="text-white/50"># Espera progresiva: 1s, 2s, 3s...</span></p>
                    <p className="text-white ml-4 mt-2">print(<span className="text-[#edd3c5]">f&quot;❌ Falló después de {'{'}MAX_REINTENTOS{'}'} intentos&quot;</span>)</p>
                    <p className="text-white ml-4"><span className="text-[#b88364]">return</span> False</p>
                    <p className="text-white mt-4"><span className="text-white/50"># ─── Programa principal ────────────────────────────────────</span></p>
                    <p className="text-white mt-2"><span className="text-[#b88364]">def</span> <span className="text-[#edd3c5]">main</span>():</p>
                    <p className="text-white ml-4">print(<span className="text-[#edd3c5]">&quot;🌤️  Estación Meteorológica Hangar 5&quot;</span>)</p>
                    <p className="text-white ml-4">print(<span className="text-[#edd3c5]">f&quot;📍 Estación: {'{'}STATION_ID{'}'}&quot;</span>)</p>
                    <p className="text-white ml-4">print(<span className="text-[#edd3c5]">f&quot;📡 Enviando cada {'{'}INTERVALO{'}'} segundos a {'{'}API_URL{'}'}&quot;</span>)</p>
                    <p className="text-white ml-4">print(<span className="text-[#edd3c5]">&quot;-&quot;</span> * 50)</p>
                    <p className="text-white ml-4 mt-2">bus, calibracion = iniciar_sensor()</p>
                    <p className="text-white ml-4"><span className="text-[#b88364]">if</span> bus <span className="text-[#b88364]">is</span> None:</p>
                    <p className="text-white ml-8">print(<span className="text-[#edd3c5]">&quot;❌ No se pudo iniciar el sensor. Saliendo.&quot;</span>)</p>
                    <p className="text-white ml-8"><span className="text-[#b88364]">return</span></p>
                    <p className="text-white ml-4 mt-2"><span className="text-[#b88364]">while</span> True:</p>
                    <p className="text-white ml-8">datos = leer_sensor(bus, calibracion)</p>
                    <p className="text-white ml-8"><span className="text-[#b88364]">if</span> datos:</p>
                    <p className="text-white ml-12">enviar_datos(datos)</p>
                    <p className="text-white ml-8"><span className="text-[#b88364]">else</span>:</p>
                    <p className="text-white ml-12">print(<span className="text-[#edd3c5]">&quot;⚠️  No se pudieron leer los datos, reintentando en el próximo ciclo&quot;</span>)</p>
                    <p className="text-white ml-8 mt-2">time.sleep(INTERVALO)</p>
                    <p className="text-white mt-4"><span className="text-[#b88364]">if</span> __name__ == <span className="text-[#edd3c5]">&quot;__main__&quot;</span>:</p>
                    <p className="text-white ml-4">main()</p>
                  </div>

                  <p>Guarda el archivo (<code>Ctrl+O</code>, luego <code>Enter</code>, luego <code>Ctrl+X</code> para salir de nano) y ejecútalo:</p>

                  <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-[#b88364] mb-3"># En la Raspberry Pi:</p>
                    <p className="text-white">python3 enviar_datos.py</p>
                    <p className="text-white/70 mt-3"># Deberías ver algo como:</p>
                    <p className="text-white">🌤️  Estación Meteorológica Hangar 5</p>
                    <p className="text-white">📍 Estación: launch</p>
                    <p className="text-white">📡 Enviando cada 60 segundos a https://hangar5.onrender.com/api/weather</p>
                    <p className="text-white">--------------------------------------------------</p>
                    <p className="text-white">✅ Sensor BME280 inicializado</p>
                    <p className="text-white">✅ Datos enviados: {'{\u0022'}station{'...'}</p>
                    <p className="text-white/70 mt-3"># Se quedará corriendo para siempre, enviando datos cada minuto.</p>
                    <p className="text-white/70"># Para detenerlo: Ctrl+C</p>
                  </div>

                  <div className="bg-[#edd3c5]/30 p-6 rounded-lg border border-[#b88364]/20">
                    <p className="font-medium text-[#1b4235] mb-3">🧠 Entendiendo el código</p>
                    <div className="space-y-3 text-sm text-[#5c3d2e]">
                      <p><strong>Funciones:</strong> Dividimos el código en partes pequeñas (<code>iniciar_sensor</code>, <code>leer_sensor</code>, <code>enviar_datos</code>) para que sea fácil de entender y arreglar si algo falla.</p>
                      <p><strong>Reintentos:</strong> Si el WiFi falla o el servidor no responde, el programa intenta 3 veces antes de darse por vencido. Entre cada intento espera un poco más (1s, 2s, 3s). Esto se llama <em>backoff progresivo</em>.</p>
                      <p><strong>Timeout:</strong> <code>timeout=10</code> evita que el programa se quede congelado esperando una respuesta que nunca va a llegar. Si en 10 segundos no hay respuesta, aborta ese intento.</p>
                      <p><strong>Ciclo infinito:</strong> <code>while True</code> hace que el programa corra para siempre. Cada vuelta, lee los sensores, envía los datos y duerme 60 segundos.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Paso 3 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">3</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">Probar con un servidor de prueba</h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    Antes de apuntar al servidor real, vamos a usar <strong>webhook.site</strong> — una
                    herramienta gratuita que te da una URL temporal donde puedes ver exactamente qué datos
                    están llegando. Es como un &quot;buzón de pruebas&quot; para APIs.
                  </p>

                  <div className="bg-white p-6 rounded-lg border border-[#1b4235]/10">
                    <p className="font-medium text-[#1b4235] mb-3">📌 Pasos para probar con webhook.site</p>
                    <ol className="space-y-2 text-sm text-[#5c3d2e] list-decimal list-inside">
                      <li>Abre <strong>webhook.site</strong> en tu navegador (en la computadora, no en la Pi)</li>
                      <li>Verás una URL única como <code className="bg-[#faf7f5] px-1 rounded">https://webhook.site/abc123-def456</code></li>
                      <li className="font-medium text-[#b88364]">¡Copia esa URL! Es tu &quot;buzón de pruebas&quot;</li>
                      <li>En la Pi, edita <code>enviar_datos.py</code> y cambia <code>API_URL</code> por tu URL de webhook.site</li>
                      <li>Ejecuta el script: <code>python3 enviar_datos.py</code></li>
                      <li>En webhook.site, verás aparecer cada envío en tiempo real con el JSON completo</li>
                    </ol>
                  </div>

                  <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-[#b88364] mb-3"># En tu Pi, cambia temporalmente la URL:</p>
                    <p className="text-white">nano enviar_datos.py</p>
                    <p className="text-white/70 mt-2"># Busca la línea de API_URL y cámbiala:</p>
                    <p className="text-white mt-2">API_URL = <span className="text-[#edd3c5]">&quot;https://webhook.site/TU-CODIGO-AQUI&quot;</span></p>
                    <p className="text-white/70 mt-2"># Guarda y ejecuta:</p>
                    <p className="text-white mt-2">python3 enviar_datos.py</p>
                    <p className="text-white/70 mt-3"># En tu navegador, en webhook.site, verás:</p>
                    <p className="text-white/70"># ┌─ POST /TU-CODIGO-AQUI</p>
                    <p className="text-white/70"># ├─ Content-Type: application/json</p>
                    <p className="text-white/70"># └─ Body:</p>
                    <p className="text-white/70">{'{'}</p>
                    <p className="text-white/70 ml-2">&quot;station&quot;: &quot;launch&quot;,</p>
                    <p className="text-white/70 ml-2">&quot;temp&quot;: 22.3,</p>
                    <p className="text-white/70 ml-2">&quot;humidity&quot;: 54.7,</p>
                    <p className="text-white/70 ml-2">&quot;pressure&quot;: 781.2</p>
                    <p className="text-white/70">{'}'}</p>
                  </div>

                  <div className="bg-[#edd3c5]/30 p-6 rounded-lg border border-[#b88364]/20">
                    <p className="font-medium text-[#1b4235] mb-2">🎉 ¡Tus datos están viajando por internet!</p>
                    <p className="text-sm text-[#5c3d2e]">
                      Lo que acabas de hacer es enorme: un sensor físico en una Raspberry Pi está leyendo
                      el clima, empaquetando los datos en JSON, y enviándolos a través de internet a un
                      servidor donde cualquiera puede verlos. Esto es exactamente lo que hacen las
                      estaciones meteorológicas profesionales. Solo que la tuya cuesta 50 veces menos.
                    </p>
                    <p className="text-sm text-[#5c3d2e] mt-2">
                      Cuando termines de probar, <strong>vuelve a cambiar API_URL a la URL original</strong> de
                      Hangar 5 para que los datos lleguen al servidor real.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sesión 2 */}
          <div>
            <h3 className="font-serif text-3xl text-[#1b4235] mb-8">Sesión 2: Visualización</h3>
            
            <div className="space-y-12">
              {/* Paso 4 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">4</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">El servidor de Hangar 5</h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    Cuando tu Pi envía los datos con <code>requests.post()</code>, estos llegan a un
                    servidor que corre en <strong>hangar5.onrender.com</strong>. Este servidor hace tres cosas:
                  </p>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-lg border border-[#1b4235]/5">
                      <p className="text-2xl mb-2">📥</p>
                      <p className="text-[#1b4235] font-medium text-sm mb-1">Recibir</p>
                      <p className="text-xs text-[#5c3d2e]/70">Recibe el JSON que envía cada Pi y verifica que tenga el formato correcto (station, temp, humidity, pressure).</p>
                    </div>
                    <div className="bg-white p-5 rounded-lg border border-[#1b4235]/5">
                      <p className="text-2xl mb-2">💾</p>
                      <p className="text-[#1b4235] font-medium text-sm mb-1">Guardar</p>
                      <p className="text-xs text-[#5c3d2e]/70">Almacena cada lectura en una base de datos con la fecha y hora exacta. Así podemos ver el histórico.</p>
                    </div>
                    <div className="bg-white p-5 rounded-lg border border-[#1b4235]/5">
                      <p className="text-2xl mb-2">🌐</p>
                      <p className="text-[#1b4235] font-medium text-sm mb-1">Servir</p>
                      <p className="text-xs text-[#5c3d2e]/70">Cuando alguien visita el sitio o la API, entrega los datos más recientes de cada estación.</p>
                    </div>
                  </div>

                  <p className="mt-4">
                    La API tiene dos endpoints (direcciones) principales que ya probaste con curl:
                  </p>

                  <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-white/50"># Obtener los datos de UNA estación específica:</p>
                    <p className="text-white"><span className="text-[#b88364]">GET</span> https://hangar5.onrender.com/api/weather/<span className="text-[#edd3c5]">launch</span></p>
                    <p className="text-white/70 mt-2"># Respuesta:</p>
                    <p className="text-white/70">{'{'} &quot;station&quot;:&quot;launch&quot;, &quot;temp&quot;:22.3, &quot;humidity&quot;:54.7, ... {'}'}</p>
                    <p className="text-white/50 mt-4"># Obtener los datos de TODAS las estaciones:</p>
                    <p className="text-white"><span className="text-[#b88364]">GET</span> https://hangar5.onrender.com/api/weather</p>
                    <p className="text-white/70 mt-2"># Respuesta (array):</p>
                    <p className="text-white/70">[{'{'} &quot;station&quot;:&quot;launch&quot;, &quot;temp&quot;:22.3, ... {'}'},</p>
                    <p className="text-white/70"> {'{'} &quot;station&quot;:&quot;midhill&quot;, &quot;temp&quot;:21.1, ... {'}'},</p>
                    <p className="text-white/70"> {'{'} &quot;station&quot;:&quot;lz&quot;, &quot;temp&quot;:23.8, ... {'}'}]</p>
                  </div>

                  <div className="bg-[#edd3c5]/30 p-4 rounded-lg border border-[#b88364]/20">
                    <p className="text-sm text-[#5c3d2e]">
                      <strong>💡 Tip:</strong> El servidor está en Render (una plataforma gratuita de hosting).
                      Si no recibe tráfico por 15 minutos, se &quot;duerme&quot;. La primera petición puede tardar
                      hasta 30 segundos en responder mientras se despierta. Las siguientes son instantáneas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Paso 5 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">5</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">Crear una página web sencilla</h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    Vamos a crear una página web que muestre los datos meteorológicos en vivo. Esta página
                    la puedes crear en tu computadora — no necesita estar en un servidor. Usaremos HTML para
                    la estructura, CSS para el estilo y JavaScript para obtener los datos de la API.
                  </p>

                  <p>Crea un archivo llamado <code>estacion.html</code> en tu computadora:</p>
                  <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-[#edd3c5]">&lt;!DOCTYPE html&gt;</p>
                    <p className="text-[#edd3c5]">&lt;html lang=&quot;es&quot;&gt;</p>
                    <p className="text-[#edd3c5]">&lt;head&gt;</p>
                    <p className="text-[#edd3c5] ml-4">&lt;meta charset=&quot;UTF-8&quot;&gt;</p>
                    <p className="text-[#edd3c5] ml-4">&lt;meta name=&quot;viewport&quot; content=&quot;width=device-width, initial-scale=1.0&quot;&gt;</p>
                    <p className="text-[#edd3c5] ml-4">&lt;title&gt;🌤️ El Peñón — Clima en Vivo&lt;/title&gt;</p>
                    <p className="text-[#edd3c5] ml-4">&lt;style&gt;</p>
                    <p className="text-white ml-8">* {'{'} margin: 0; padding: 0; box-sizing: border-box; {'}'}</p>
                    <p className="text-white ml-8">body {'{'}</p>
                    <p className="text-white ml-12">font-family: system-ui, -apple-system, sans-serif;</p>
                    <p className="text-white ml-12">background: #1b4235;</p>
                    <p className="text-white ml-12">color: white;</p>
                    <p className="text-white ml-12">min-height: 100vh;</p>
                    <p className="text-white ml-12">display: flex;</p>
                    <p className="text-white ml-12">flex-direction: column;</p>
                    <p className="text-white ml-12">align-items: center;</p>
                    <p className="text-white ml-12">justify-content: center;</p>
                    <p className="text-white ml-12">padding: 2rem;</p>
                    <p className="text-white ml-8">{'}'}</p>
                    <p className="text-white ml-8">.card {'{'}</p>
                    <p className="text-white ml-12">background: rgba(255,255,255,0.08);</p>
                    <p className="text-white ml-12">border-radius: 1rem;</p>
                    <p className="text-white ml-12">padding: 3rem 4rem;</p>
                    <p className="text-white ml-12">text-align: center;</p>
                    <p className="text-white ml-12">backdrop-filter: blur(10px);</p>
                    <p className="text-white ml-12">border: 1px solid rgba(255,255,255,0.1);</p>
                    <p className="text-white ml-8">{'}'}</p>
                    <p className="text-white ml-8">.station-name {'{'}</p>
                    <p className="text-white ml-12">font-size: 0.75rem;</p>
                    <p className="text-white ml-12">text-transform: uppercase;</p>
                    <p className="text-white ml-12">letter-spacing: 0.2em;</p>
                    <p className="text-white ml-12">color: #b88364;</p>
                    <p className="text-white ml-12">margin-bottom: 1rem;</p>
                    <p className="text-white ml-8">{'}'}</p>
                    <p className="text-white ml-8">.temp {'{'}</p>
                    <p className="text-white ml-12">font-size: 5rem;</p>
                    <p className="text-white ml-12">font-weight: 200;</p>
                    <p className="text-white ml-12">line-height: 1;</p>
                    <p className="text-white ml-8">{'}'}</p>
                    <p className="text-white ml-8">.unit {'{'}</p>
                    <p className="text-white ml-12">font-size: 1.5rem;</p>
                    <p className="text-white ml-12">color: rgba(255,255,255,0.4);</p>
                    <p className="text-white ml-8">{'}'}</p>
                    <p className="text-white ml-8">.details {'{'}</p>
                    <p className="text-white ml-12">display: flex;</p>
                    <p className="text-white ml-12">gap: 2rem;</p>
                    <p className="text-white ml-12">margin-top: 2rem;</p>
                    <p className="text-white ml-12">justify-content: center;</p>
                    <p className="text-white ml-8">{'}'}</p>
                    <p className="text-white ml-8">.detail-item {'{'}</p>
                    <p className="text-white ml-12">text-align: center;</p>
                    <p className="text-white ml-8">{'}'}</p>
                    <p className="text-white ml-8">.detail-label {'{'}</p>
                    <p className="text-white ml-12">font-size: 0.7rem;</p>
                    <p className="text-white ml-12">text-transform: uppercase;</p>
                    <p className="text-white ml-12">letter-spacing: 0.15em;</p>
                    <p className="text-white ml-12">color: rgba(255,255,255,0.4);</p>
                    <p className="text-white ml-12">margin-bottom: 0.3rem;</p>
                    <p className="text-white ml-8">{'}'}</p>
                    <p className="text-white ml-8">.detail-value {'{'}</p>
                    <p className="text-white ml-12">font-size: 1.5rem;</p>
                    <p className="text-white ml-12">font-weight: 300;</p>
                    <p className="text-white ml-8">{'}'}</p>
                    <p className="text-white ml-8">.loading {'{'}</p>
                    <p className="text-white ml-12">color: rgba(255,255,255,0.3);</p>
                    <p className="text-white ml-12">font-style: italic;</p>
                    <p className="text-white ml-8">{'}'}</p>
                    <p className="text-white ml-8">.updated {'{'}</p>
                    <p className="text-white ml-12">margin-top: 2rem;</p>
                    <p className="text-white ml-12">font-size: 0.7rem;</p>
                    <p className="text-white ml-12">color: rgba(255,255,255,0.2);</p>
                    <p className="text-white ml-8">{'}'}</p>
                    <p className="text-[#edd3c5] ml-4">&lt;/style&gt;</p>
                    <p className="text-[#edd3c5] ml-4 mt-2">&lt;/head&gt;</p>
                    <p className="text-[#edd3c5]">&lt;body&gt;</p>
                    <p className="text-[#edd3c5] ml-4">&lt;div class=&quot;card&quot;&gt;</p>
                    <p className="text-[#edd3c5] ml-8">&lt;div class=&quot;station-name&quot;&gt;📍 Despegue&lt;/div&gt;</p>
                    <p className="text-[#edd3c5] ml-8">&lt;div class=&quot;temp&quot;&gt;</p>
                    <p className="text-[#edd3c5] ml-12">&lt;span id=&quot;temperatura&quot; class=&quot;loading&quot;&gt;--&lt;/span&gt;</p>
                    <p className="text-[#edd3c5] ml-12">&lt;span class=&quot;unit&quot;&gt;°C&lt;/span&gt;</p>
                    <p className="text-[#edd3c5] ml-8">&lt;/div&gt;</p>
                    <p className="text-[#edd3c5] ml-8">&lt;div class=&quot;details&quot;&gt;</p>
                    <p className="text-[#edd3c5] ml-12">&lt;div class=&quot;detail-item&quot;&gt;</p>
                    <p className="text-[#edd3c5] ml-16">&lt;div class=&quot;detail-label&quot;&gt;Humedad&lt;/div&gt;</p>
                    <p className="text-[#edd3c5] ml-16">&lt;div class=&quot;detail-value&quot; id=&quot;humedad&quot; class=&quot;loading&quot;&gt;--%&lt;/div&gt;</p>
                    <p className="text-[#edd3c5] ml-12">&lt;/div&gt;</p>
                    <p className="text-[#edd3c5] ml-12">&lt;div class=&quot;detail-item&quot;&gt;</p>
                    <p className="text-[#edd3c5] ml-16">&lt;div class=&quot;detail-label&quot;&gt;Presión&lt;/div&gt;</p>
                    <p className="text-[#edd3c5] ml-16">&lt;div class=&quot;detail-value&quot; id=&quot;presion&quot; class=&quot;loading&quot;&gt;-- hPa&lt;/div&gt;</p>
                    <p className="text-[#edd3c5] ml-12">&lt;/div&gt;</p>
                    <p className="text-[#edd3c5] ml-12">&lt;div class=&quot;detail-item&quot;&gt;</p>
                    <p className="text-[#edd3c5] ml-16">&lt;div class=&quot;detail-label&quot;&gt;Viento&lt;/div&gt;</p>
                    <p className="text-[#edd3c5] ml-16">&lt;div class=&quot;detail-value&quot; id=&quot;viento&quot; class=&quot;loading&quot;&gt;-- km/h&lt;/div&gt;</p>
                    <p className="text-[#edd3c5] ml-12">&lt;/div&gt;</p>
                    <p className="text-[#edd3c5] ml-8">&lt;/div&gt;</p>
                    <p className="text-[#edd3c5] ml-8">&lt;div class=&quot;updated&quot; id=&quot;actualizado&quot;&gt;&lt;/div&gt;</p>
                    <p className="text-[#edd3c5] ml-4">&lt;/div&gt;</p>
                    <p className="text-[#edd3c5] ml-4 mt-3">&lt;script&gt;</p>
                    <p className="text-white/50 ml-8">// ─── Obtener datos de la API ────────────────────────</p>
                    <p className="text-white ml-8"><span className="text-[#b88364]">const</span> API_URL = <span className="text-[#edd3c5]">&#039;https://hangar5.onrender.com/api/weather/launch&#039;</span>;</p>
                    <p className="text-white ml-8 mt-2"><span className="text-[#b88364]">async function</span> <span className="text-[#edd3c5]">obtenerDatos</span>() {'{'}</p>
                    <p className="text-white ml-12"><span className="text-[#b88364]">try</span> {'{'}</p>
                    <p className="text-white ml-16"><span className="text-white/50">// fetch() hace una petición HTTP GET a la API</span></p>
                    <p className="text-white ml-16"><span className="text-[#b88364]">const</span> respuesta = <span className="text-[#b88364]">await</span> fetch(API_URL);</p>
                    <p className="text-white ml-16 mt-2"><span className="text-white/50">// Convertir la respuesta de JSON a objeto de JavaScript</span></p>
                    <p className="text-white ml-16"><span className="text-[#b88364]">const</span> datos = <span className="text-[#b88364]">await</span> respuesta.json();</p>
                    <p className="text-white ml-16 mt-2"><span className="text-white/50">// Actualizar el HTML con los datos recibidos</span></p>
                    <p className="text-white ml-16">document.getElementById(<span className="text-[#edd3c5]">&#039;temperatura&#039;</span>).textContent = datos.temp;</p>
                    <p className="text-white ml-16">document.getElementById(<span className="text-[#edd3c5]">&#039;humedad&#039;</span>).textContent = datos.humidity + <span className="text-[#edd3c5]">&#039;%&#039;</span>;</p>
                    <p className="text-white ml-16">document.getElementById(<span className="text-[#edd3c5]">&#039;presion&#039;</span>).textContent = datos.pressure + <span className="text-[#edd3c5]">&#039; hPa&#039;</span>;</p>
                    <p className="text-white ml-16">document.getElementById(<span className="text-[#edd3c5]">&#039;viento&#039;</span>).textContent = (datos.wind_speed || <span className="text-[#edd3c5]">&#039;--&#039;</span>) + <span className="text-[#edd3c5]">&#039; km/h&#039;</span>;</p>
                    <p className="text-white ml-16 mt-2"><span className="text-white/50">// Mostrar cuándo se actualizó</span></p>
                    <p className="text-white ml-16"><span className="text-[#b88364]">const</span> ahora = <span className="text-[#b88364]">new</span> Date().toLocaleTimeString(<span className="text-[#edd3c5]">&#039;es-MX&#039;</span>);</p>
                    <p className="text-white ml-16">document.getElementById(<span className="text-[#edd3c5]">&#039;actualizado&#039;</span>).textContent = <span className="text-[#edd3c5]">&#039;Actualizado: &#039;</span> + ahora;</p>
                    <p className="text-white ml-12">{'}'} <span className="text-[#b88364]">catch</span> (error) {'{'}</p>
                    <p className="text-white ml-16">console.error(<span className="text-[#edd3c5]">&#039;Error al obtener datos:&#039;</span>, error);</p>
                    <p className="text-white ml-16">document.getElementById(<span className="text-[#edd3c5]">&#039;temperatura&#039;</span>).textContent = <span className="text-[#edd3c5]">&#039;⚠️&#039;</span>;</p>
                    <p className="text-white ml-12">{'}'}</p>
                    <p className="text-white ml-8">{'}'}</p>
                    <p className="text-white ml-8 mt-2"><span className="text-white/50">// Ejecutar al cargar la página y luego cada 30 segundos</span></p>
                    <p className="text-white ml-8">obtenerDatos();</p>
                    <p className="text-white ml-8">setInterval(obtenerDatos, <span className="text-[#b88364]">30000</span>);  <span className="text-white/50">// 30,000 ms = 30 segundos</span></p>
                    <p className="text-[#edd3c5] ml-4">&lt;/script&gt;</p>
                    <p className="text-[#edd3c5]">&lt;/body&gt;</p>
                    <p className="text-[#edd3c5]">&lt;/html&gt;</p>
                  </div>

                  <p>Guarda el archivo y ábrelo en tu navegador (doble clic en <code>estacion.html</code>). Verás algo como:</p>

                  <div className="bg-[#1b4235] text-white p-8 rounded-lg text-center">
                    <p className="text-xs tracking-[0.2em] uppercase text-[#b88364] mb-3">📍 Despegue</p>
                    <p className="text-6xl font-light mb-2">22.3<span className="text-2xl text-white/30">°C</span></p>
                    <div className="flex gap-8 justify-center mt-6">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-white/30">Humedad</p>
                        <p className="text-2xl font-light">54.7%</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-white/30">Presión</p>
                        <p className="text-2xl font-light">781 hPa</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-white/30">Viento</p>
                        <p className="text-2xl font-light">12.5 km/h</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-white/15 mt-6">Actualizado: 14:32:05</p>
                  </div>

                  <div className="bg-[#edd3c5]/30 p-6 rounded-lg border border-[#b88364]/20">
                    <p className="font-medium text-[#1b4235] mb-3">🧠 Entendiendo el JavaScript</p>
                    <div className="space-y-2 text-sm text-[#5c3d2e]">
                      <p><strong>fetch():</strong> Es la función de JavaScript para hacer peticiones HTTP. Por defecto usa GET. Piensa en fetch como &quot;ve a esta URL y tráeme lo que haya&quot;.</p>
                      <p><strong>async / await:</strong> Como fetch tarda (milisegundos, pero tarda), usamos await para decir &quot;espera a que llegue la respuesta antes de seguir&quot;.</p>
                      <p><strong>.json():</strong> Convierte la respuesta (que viene como texto) en un objeto de JavaScript que podemos usar con datos.temp, datos.humidity, etc.</p>
                      <p><strong>setInterval():</strong> Ejecuta obtenerDatos() cada 30 segundos. Así la página se actualiza sola sin que nadie toque nada.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Paso 6 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">6</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">El tablero de control final</h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    El tablero de control final de Hangar 5 muestra <strong>todas las estaciones en una sola
                    pantalla</strong>. Así es como se ve en producción — y lo que acabas de construir es
                    exactamente la misma tecnología:\n                  </p>

                  {/* Mockup del dashboard */}
                  <div className="bg-[#1b4235] p-6 md:p-10 rounded-lg text-white">
                    <p className="text-center text-[#b88364] text-xs tracking-[0.3em] uppercase mb-8">Red Meteorológica · El Peñón</p>
                    
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      {/* Launch */}
                      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs tracking-[0.15em] uppercase text-[#b88364]">🚀 Despegue</p>
                          <span className="text-[10px] text-white/20 bg-white/5 px-2 py-0.5 rounded-full">2,840 m</span>
                        </div>
                        <div className="flex items-end gap-2 mb-4">
                          <span className="text-4xl font-light">22.3°</span>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl" style={{ transform: 'rotate(180deg)' }}>↑</span>
                          <div>
                            <p className="text-lg font-light">12.5 <span className="text-xs text-white/30">km/h</span></p>
                            <p className="text-[10px] text-white/20 uppercase tracking-wider">Sur · 180°</p>
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-white/40">
                          <span>💧 54%</span>
                          <span>🔵 781 hPa</span>
                        </div>
                      </div>

                      {/* Midhill */}
                      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs tracking-[0.15em] uppercase text-[#b88364]">⛰️ Medio Cerro</p>
                          <span className="text-[10px] text-white/20 bg-white/5 px-2 py-0.5 rounded-full">2,550 m</span>
                        </div>
                        <div className="flex items-end gap-2 mb-4">
                          <span className="text-4xl font-light">21.1°</span>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl" style={{ transform: 'rotate(225deg)' }}>↑</span>
                          <div>
                            <p className="text-lg font-light">8.2 <span className="text-xs text-white/30">km/h</span></p>
                            <p className="text-[10px] text-white/20 uppercase tracking-wider">Suroeste · 225°</p>
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-white/40">
                          <span>💧 58%</span>
                          <span>🔵 798 hPa</span>
                        </div>
                      </div>

                      {/* LZ */}
                      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs tracking-[0.15em] uppercase text-[#b88364]">🎯 Aterrizaje</p>
                          <span className="text-[10px] text-white/20 bg-white/5 px-2 py-0.5 rounded-full">2,150 m</span>
                        </div>
                        <div className="flex items-end gap-2 mb-4">
                          <span className="text-4xl font-light">23.8°</span>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl" style={{ transform: 'rotate(90deg)' }}>↑</span>
                          <div>
                            <p className="text-lg font-light">5.1 <span className="text-xs text-white/30">km/h</span></p>
                            <p className="text-[10px] text-white/20 uppercase tracking-wider">Este · 90°</p>
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-white/40">
                          <span>💧 62%</span>
                          <span>🔵 812 hPa</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p>
                    Cada tarjeta muestra:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-2">
                      <span className="text-[#b88364]">→</span>
                      <span><strong>Nombre y altitud</strong> de la estación</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#b88364]">→</span>
                      <span><strong>Temperatura actual</strong> en grande — lo primero que necesita un piloto</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#b88364]">→</span>
                      <span><strong>Flecha de viento</strong> que apunta en la dirección real del viento (0° = Norte apunta hacia arriba)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#b88364]">→</span>
                      <span><strong>Velocidad del viento</strong> en km/h y dirección en grados con nombre (N, NE, E, SE, S, SW, W, NW)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#b88364]">→</span>
                      <span><strong>Humedad y presión</strong> — datos complementarios para decisiones de vuelo</span>
                    </li>
                  </ul>

                  <div className="bg-white p-6 rounded-lg border border-[#1b4235]/10 mt-6">
                    <p className="font-medium text-[#1b4235] mb-3">📌 ¿Qué busca un piloto en este tablero?</p>
                    <div className="space-y-3 text-sm text-[#5c3d2e]">
                      <p><strong>Viento:</strong> Menos de 15 km/h es volable. Más de 20 km/h, peligroso. Dirección: ¿viene de frente al despegue o de cola? La flecha lo muestra de un vistazo.</p>
                      <p><strong>Temperatura:</strong> A mayor diferencia entre despegue y aterrizaje, más térmicas. Si el despegue está más caliente que el valle, hay ascendencia.</p>
                      <p><strong>Presión:</strong> Si está bajando rápido en las tres estaciones, se acerca mal tiempo. Mejor no volar.</p>
                      <p><strong>Humedad:</strong> Si está muy alta en el despegue, puede haber nubes bajas o neblina. Riesgo de no ver el aterrizaje.</p>
                    </div>
                  </div>

                  <div className="bg-[#edd3c5]/30 p-6 rounded-lg border border-[#b88364]/20 mt-4">
                    <p className="font-medium text-[#1b4235] mb-2">🎉 ¡Fase 3 completada!</p>
                    <p className="text-sm text-[#5c3d2e] leading-relaxed">
                      Ahora sabes cómo los datos viajan desde un sensor físico en una montaña hasta una
                      pantalla en cualquier parte del mundo. Entendiste APIs REST, JSON, HTTP, fetch(),
                      Python con requests, y creaste tu propia página de clima en vivo. En la siguiente
                      fase vamos a preparar la estación para vivir a la intemperie: impermeabilización,
                      soldadura y montaje físico.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navegación entre fases */}
      <section className="py-16 bg-[#1b4235] text-white">
        <div className="max-w-4xl mx-auto px-6 flex justify-between items-center">
          <Link
            href="/comunidad/fase-2-prototipo"
            className="group flex items-center gap-4 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          >
            <span className="text-2xl group-hover:-translate-x-1 transition-transform">←</span>
            <div>
              <p className="text-xs text-[#b88364] tracking-wider uppercase">Anterior</p>
              <p className="text-lg font-serif">Fase 2: Prototipo</p>
            </div>
          </Link>
          <Link
            href="/comunidad/fase-4-impermeabilizacion"
            className="group flex items-center gap-4 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          >
            <div className="text-right">
              <p className="text-xs text-[#b88364] tracking-wider uppercase">Siguiente</p>
              <p className="text-lg font-serif">Fase 4: Montaje</p>
            </div>
            <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </section>

      <footer className="bg-[#0f2a20] text-white/30 py-12 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs tracking-[0.3em] uppercase mb-2">Hangar 5 · Comunidad</p>
          <p className="text-xs">
            <Link href="/comunidad" className="hover:text-white/60 transition-colors">Curso completo</Link>
            {' · '}Curso gratuito y abierto · © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </main>
  );
}
