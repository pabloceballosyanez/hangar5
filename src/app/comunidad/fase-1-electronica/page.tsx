import Link from 'next/link';
import CursoNav from '../CursoNav';

export const metadata = {
  title: 'Fase 1: Electrónica Básica — Red Meteorológica Comunitaria',
  description: 'Aprende a identificar componentes, usar protoboard, conectar sensores I²C y leer temperatura con Python y Raspberry Pi.',
};

export default function Fase1Page() {
  return (
    <main className="min-h-screen bg-[#faf7f5]">
      <CursoNav fase={1} />

      {/* Hero */}
      <section className="relative py-32 bg-[#1b4235] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/img/paisaje.jpg')] bg-cover bg-center" />
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">Fase 1 · 2 sesiones</p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.1] mb-6 tracking-[-0.02em]">
            Electrónica<br /><span className="italic">Básica</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            El primer paso para construir tu estación meteorológica. Aprenderás qué es una Raspberry Pi,
            cómo conectar sensores y cómo leer datos con Python. No necesitas experiencia previa.
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
              'Qué es una Raspberry Pi y cómo encenderla por primera vez',
              'Flashear una tarjeta microSD con Raspberry Pi OS',
              'Conectarte a la Pi por SSH desde tu computadora',
              'Identificar componentes electrónicos básicos (resistencias, jumpers, pines GPIO)',
              'Entender qué es el protocolo I²C y cómo funciona',
              'Conectar un sensor BME280 a la Raspberry Pi',
              'Escribir tu primer programa en Python para leer temperatura, humedad y presión',
              'Interpretar los datos: ¿qué significan las lecturas del sensor?',
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
                  <th className="py-4 text-right text-xs tracking-[0.2em] uppercase text-[#b88364] font-normal">Costo est.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b4235]/5">
                {[
                  ['1', 'Raspberry Pi Zero 2 W (o Pi 3/4)', '~$800'],
                  ['1', 'Tarjeta microSD de 16 GB o más', '~$120'],
                  ['1', 'Sensor BME280 (I²C)', '~$150'],
                  ['1', 'Protoboard de 400 puntos', '~$80'],
                  ['10', 'Jumpers macho-hembra', '~$50'],
                  ['1', 'Cable micro USB + fuente 5V 2A', '~$150'],
                  ['1', 'Lector de microSD (para flashear)', '~$100'],
                ].map(([cant, mat, cost]) => (
                  <tr key={mat} className="hover:bg-[#faf7f5] transition-colors">
                    <td className="py-4 pr-8 text-sm text-[#1b4235] font-medium">{cant}</td>
                    <td className="py-4 pr-8 text-sm text-[#5c3d2e]">{mat}</td>
                    <td className="py-4 text-right text-sm text-[#1b4235] font-medium">{cost}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#b88364]/20">
                  <td className="py-6 pr-8 text-lg font-serif text-[#1b4235]" colSpan={2}>Total materiales Fase 1</td>
                  <td className="py-6 text-right text-lg font-serif text-[#1b4235]">~$1,450 MXN</td>
                </tr>
              </tfoot>
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
            <h3 className="font-serif text-3xl text-[#1b4235] mb-8">Sesión 1: Conociendo la Raspberry Pi</h3>
            
            <div className="space-y-12">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">1</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">¿Qué es una Raspberry Pi?</h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    La Raspberry Pi es una computadora completa del tamaño de una tarjeta de crédito. Tiene procesador,
                    memoria RAM, puertos USB, salida HDMI y — lo más importante para nosotros — un conector de 40 pines
                    llamado <strong>GPIO</strong> (General Purpose Input/Output) que permite conectar sensores, motores,
                    luces y todo tipo de componentes electrónicos.
                  </p>
                  <p>
                    Para nuestro proyecto usaremos la <strong>Raspberry Pi Zero 2 W</strong>, la versión más pequeña
                    y económica con WiFi integrado. Consume muy poca energía — ideal para funcionar con panel solar.
                  </p>
                  <div className="bg-white p-6 rounded-lg border border-[#1b4235]/10">
                    <p className="text-sm font-medium text-[#1b4235] mb-2">📌 Especificaciones de la Pi Zero 2 W</p>
                    <ul className="text-sm space-y-1 text-[#5c3d2e]">
                      <li>• Procesador: Quad-core 64-bit ARM Cortex-A53 a 1 GHz</li>
                      <li>• Memoria: 512 MB RAM</li>
                      <li>• Conectividad: WiFi 2.4GHz, Bluetooth 4.2</li>
                      <li>• Puertos: Mini HDMI, 2 × Micro USB, CSI (cámara), GPIO 40 pines</li>
                      <li>• Consumo: ~2.5W en operación normal</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">2</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">Preparar la tarjeta microSD</h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    Para que la Raspberry Pi funcione, necesitamos instalarle un sistema operativo en una tarjeta microSD.
                    Usaremos <strong>Raspberry Pi Imager</strong>, la herramienta oficial.
                  </p>
                  <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-[#b88364] mb-3"># En tu computadora (Mac/Windows/Linux)</p>
                    <p className="text-white/70">1. Descarga Raspberry Pi Imager de: https://www.raspberrypi.com/software/</p>
                    <p className="text-white/70">2. Conecta la microSD a tu computadora</p>
                    <p className="text-white/70">3. Abre Imager y selecciona:</p>
                    <p className="text-white/70 ml-4">👆 Raspberry Pi Device &gt; Raspberry Pi Zero 2 W</p>
                    <p className="text-white/70 ml-4">👆 Operating System &gt; Raspberry Pi OS Lite (64-bit)</p>
                    <p className="text-white/70 ml-4">👆 Storage &gt; Tu tarjeta microSD</p>
                    <p className="text-white/70 mt-2">4. Haz clic en el engranaje ⚙️ y configura:</p>
                    <p className="text-white/70 ml-4">• Hostname: estacion-peñon-01</p>
                    <p className="text-white/70 ml-4">• Username: piloto</p>
                    <p className="text-white/70 ml-4">• Password: (elige una segura)</p>
                    <p className="text-white/70 ml-4">• ☑️ Enable SSH (password authentication)</p>
                    <p className="text-white/70 ml-4">• ☑️ Configure wireless LAN (WiFi del Hangar o del taller)</p>
                    <p className="text-white/70 mt-2">5. Haz clic en WRITE y espera a que termine</p>
                  </div>
                  <div className="bg-[#edd3c5]/30 p-4 rounded-lg border border-[#b88364]/20">
                    <p className="text-sm text-[#5c3d2e]">
                      <strong>💡 Tip para el instructor:</strong> Prepara una microSD maestra con todo configurado
                      y clónala para todas las Pi del taller. Así los estudiantes arrancan directo con la práctica.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">3</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">Primer arranque y conexión por SSH</h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    SSH (Secure Shell) te permite controlar la Raspberry Pi desde otra computadora sin necesidad de
                    conectarle monitor, teclado ni ratón. Es la forma en que trabajaremos siempre con la Pi.
                  </p>
                  <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-[#b88364] mb-3"># En tu computadora</p>
                    <p className="text-white/70"># Inserta la microSD en la Pi, conecta el cable de corriente USB.</p>
                    <p className="text-white/70"># La luz verde indica que está encendida.</p>
                    <p className="text-white/70"># Espera 1-2 minutos a que arranque.</p>
                    <p className="text-white/70 mt-3"># En Mac/Linux, abre Terminal. En Windows, abre PowerShell o PuTTY.</p>
                    <p className="text-white mt-2">ssh piloto@estacion-peñon-01.local</p>
                    <p className="text-white/70 mt-2"># La primera vez te preguntará si confías. Escribe "yes".</p>
                    <p className="text-white/70"># Ingresa la contraseña que configuraste en Imager.</p>
                    <p className="text-white/70 mt-2"># 🎉 ¡Ya estás dentro de la Raspberry Pi!</p>
                  </div>
                  <p>
                    Practica algunos comandos básicos de Linux:
                  </p>
                  <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-white">whoami        <span className="text-white/40"># ¿Quién eres? → piloto</span></p>
                    <p className="text-white">hostname      <span className="text-white/40"># ¿Cómo se llama esta Pi? → estacion-peñon-01</span></p>
                    <p className="text-white">pwd           <span className="text-white/40"># ¿Dónde estoy? → /home/piloto</span></p>
                    <p className="text-white">ls            <span className="text-white/40"># ¿Qué archivos hay aquí?</span></p>
                    <p className="text-white">sudo apt update  <span className="text-white/40"># Actualiza la lista de paquetes</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sesión 2 */}
          <div>
            <h3 className="font-serif text-3xl text-[#1b4235] mb-8">Sesión 2: Conectando sensores y programando</h3>
            
            <div className="space-y-12">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">4</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">El protocolo I²C y el sensor BME280</h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    <strong>I²C</strong> (Inter-Integrated Circuit, se lee "i-cuadrado-c") es un protocolo que permite
                    que la Raspberry Pi se comunique con sensores usando solo 4 cables: dos para alimentación
                    (VCC/3.3V y GND) y dos para datos (SDA y SCL). Es el protocolo más común para sensores meteorológicos.
                  </p>
                  <p>
                    El <strong>BME280</strong> es un sensor que mide temperatura, humedad y presión atmosférica en un solo
                    chip. Se conecta por I²C y es el corazón de nuestra estación meteorológica.
                  </p>
                  
                  <div className="bg-white p-6 rounded-lg border border-[#1b4235]/10">
                    <p className="font-medium text-[#1b4235] mb-3">📌 Conexiones BME280 → Raspberry Pi</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#1b4235]/10">
                          <th className="py-2 pr-4 text-left text-[#b88364]">Pin BME280</th>
                          <th className="py-2 pr-4 text-left text-[#b88364]">Conectar a</th>
                          <th className="py-2 text-left text-[#b88364]">Pin GPIO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1b4235]/5">
                        <tr><td className="py-2 pr-4 font-medium">VCC</td><td className="py-2 pr-4">3.3V</td><td className="py-2">Pin 1</td></tr>
                        <tr><td className="py-2 pr-4 font-medium">GND</td><td className="py-2 pr-4">Tierra / Ground</td><td className="py-2">Pin 6</td></tr>
                        <tr><td className="py-2 pr-4 font-medium">SDA</td><td className="py-2 pr-4">Datos I²C</td><td className="py-2">Pin 3 (GPIO 2)</td></tr>
                        <tr><td className="py-2 pr-4 font-medium">SCL</td><td className="py-2 pr-4">Reloj I²C</td><td className="py-2">Pin 5 (GPIO 3)</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <p>
                    Coloca el BME280 en la protoboard y usa los jumpers macho-hembra para conectarlo a los pines GPIO
                    de la Raspberry Pi. La protoboard te permite conectar sin soldar — perfecto para experimentar.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">5</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">Activar I²C en la Raspberry Pi</h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    Por seguridad, I²C viene desactivado. Hay que activarlo:
                  </p>
                  <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-[#b88364] mb-3"># Conectado por SSH a tu Pi:</p>
                    <p className="text-white">sudo raspi-config</p>
                    <p className="text-white/70 mt-2"># Navega con las flechas:</p>
                    <p className="text-white/70"># 3 Interface Options &gt; I5 I2C &gt; Yes &gt; OK &gt; Finish</p>
                    <p className="text-white/70 mt-2"># Reinicia:</p>
                    <p className="text-white mt-2">sudo reboot</p>
                  </div>
                  <p>Después de reiniciar, verifica que I²C funciona:</p>
                  <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-[#b88364] mb-3"># Vuelve a conectarte por SSH y ejecuta:</p>
                    <p className="text-white">sudo apt install -y i2c-tools python3-smbus</p>
                    <p className="text-white mt-2">i2cdetect -y 1</p>
                    <p className="text-white/70 mt-2"># Deberías ver algo como:</p>
                    <p className="text-white/70">#      0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f</p>
                    <p className="text-white/70"># 00:                         -- -- -- -- -- -- -- --</p>
                    <p className="text-white/70"># 10: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --</p>
                    <p className="text-white"># 70: -- -- -- -- -- -- -- <span className="text-[#b88364] font-bold">76</span> -- -- -- -- -- -- --</p>
                    <p className="text-white/70 mt-2"># Si ves 76 (o 77), ¡el sensor está conectado y funcionando!</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">6</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">Tu primer programa: leer el clima</h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    Vamos a escribir un programa en Python que lea los datos del BME280.
                    Primero instalamos la biblioteca del sensor:
                  </p>
                  <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-[#b88364] mb-3"># Instalamos la biblioteca</p>
                    <p className="text-white">sudo pip3 install bme280 --break-system-packages</p>
                  </div>
                  <p>Ahora creamos nuestro script:</p>
                  <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-[#b88364] mb-3"># Crea el archivo clima.py</p>
                    <p className="text-white">nano clima.py</p>
                    <p className="text-white/70 mt-2"># Pega este código:</p>
                    <p className="text-white mt-3"><span className="text-[#b88364]">import</span> smbus2</p>
                    <p className="text-white"><span className="text-[#b88364]">import</span> bme280</p>
                    <p className="text-white"><span className="text-[#b88364]">import</span> time</p>
                    <p className="text-white mt-2"><span className="text-white/50"># Conectarse al sensor (dirección I²C 0x76)</span></p>
                    <p className="text-white">bus = smbus2.SMBus(1)</p>
                    <p className="text-white">calibration = bme280.load_calibration_params(bus, 0x76)</p>
                    <p className="text-white mt-2"><span className="text-white/50"># Leer datos</span></p>
                    <p className="text-white">data = bme280.sample(bus, 0x76, calibration)</p>
                    <p className="text-white mt-2"><span className="text-white/50"># Mostrar en pantalla</span></p>
                    <p className="text-white mt-1">print(<span className="text-[#edd3c5]">f"Temperatura: </span><span className="text-white">{"{"}</span>data.temperature:.1f<span className="text-white">{"}"}</span><span className="text-[#edd3c5]"> °C"</span>)</p>
                    <p className="text-white">print(<span className="text-[#edd3c5]">f"Humedad:    </span><span className="text-white">{"{"}</span>data.humidity:.1f<span className="text-white">{"}"}</span><span className="text-[#edd3c5]"> %"</span>)</p>
                    <p className="text-white">print(<span className="text-[#edd3c5]">f"Presión:    </span><span className="text-white">{"{"}</span>data.pressure:.1f<span className="text-white">{"}"}</span><span className="text-[#edd3c5]"> hPa"</span>)</p>
                  </div>
                  <p>Ejecútalo:</p>
                  <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-white">python3 clima.py</p>
                    <p className="text-white/70 mt-2"># Resultado:</p>
                    <p className="text-white">Temperatura: 22.3 °C</p>
                    <p className="text-white">Humedad:    54.7 %</p>
                    <p className="text-white">Presión:    781.2 hPa</p>
                  </div>
                  <div className="bg-[#edd3c5]/30 p-6 rounded-lg border border-[#b88364]/20">
                    <p className="font-medium text-[#1b4235] mb-2">🎉 ¡Lo lograste!</p>
                    <p className="text-sm text-[#5c3d2e] leading-relaxed">
                      Acabas de escribir tu primer programa que lee datos meteorológicos reales
                      desde un sensor físico. Toca el sensor con el dedo y vuelve a ejecutar:
                      ¿subió la temperatura? Sopla sobre él: ¿subió la humedad?
                      Así funciona la ciencia: observar, medir, comprobar.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">7</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">Entendiendo los datos</h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-lg border border-[#1b4235]/5">
                      <p className="text-[#b88364] text-xs tracking-wider uppercase mb-2">Temperatura</p>
                      <p className="text-sm">En grados Celsius (°C). A mayor altitud, menor temperatura (~6.5°C menos por cada 1000 m de ascenso).</p>
                    </div>
                    <div className="bg-white p-5 rounded-lg border border-[#1b4235]/5">
                      <p className="text-[#b88364] text-xs tracking-wider uppercase mb-2">Humedad relativa</p>
                      <p className="text-sm">En porcentaje (%). Indica cuánta agua hay en el aire. Nubes se forman al llegar al 100%.</p>
                    </div>
                    <div className="bg-white p-5 rounded-lg border border-[#1b4235]/5">
                      <p className="text-[#b88364] text-xs tracking-wider uppercase mb-2">Presión atmosférica</p>
                      <p className="text-sm">En hectopascales (hPa). Si baja rápido, se acerca mal tiempo. Si sube, mejora.</p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-lg border border-[#1b4235]/10">
                    <p className="font-medium text-[#1b4235] mb-2">🧪 Experimento para el taller</p>
                    <p className="text-sm text-[#5c3d2e]">
                      Coloca el sensor dentro de un frasco cerrado con un poco de agua tibia en el fondo.
                      Ejecuta el script cada 30 segundos durante 5 minutos.
                      ¿Qué pasa con la humedad? ¿Por qué?
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
          <div />
          <Link
            href="/comunidad/fase-2-prototipo"
            className="group flex items-center gap-4 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          >
            <div className="text-right">
              <p className="text-xs text-[#b88364] tracking-wider uppercase">Siguiente</p>
              <p className="text-lg font-serif">Fase 2: Prototipo</p>
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
