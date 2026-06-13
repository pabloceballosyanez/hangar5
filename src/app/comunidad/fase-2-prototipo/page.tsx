import Link from 'next/link';
import CursoNav from '../CursoNav';

export const metadata = {
  title: 'Fase 2: Armado del Prototipo — Red Meteorológica Comunitaria',
  description: 'Ensambla la estación meteorológica completa: conecta el anemómetro, el circuito solar autónomo y escribe el script principal de recolección de datos con Python.',
};

export default function Fase2Page() {
  return (
    <main className="min-h-screen bg-[#faf7f5]">
      <CursoNav fase={2} />

      {/* Hero */}
      <section className="relative py-32 bg-[#1b4235] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/img/paisaje.jpg')] bg-cover bg-center" />
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">Fase 2 · 1 sesión</p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.1] mb-6 tracking-[-0.02em]">
            Armado del<br /><span className="italic">Prototipo</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            El día que todo cobra vida. Conectas el anemómetro para medir el viento, armas el circuito de alimentación
            solar autónoma, monitoreas la batería y escribes el script que une todos los sensores en uno solo.
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
              'Conectar un anemómetro de reed switch a los pines GPIO de la Raspberry Pi',
              'Calcular la velocidad del viento en km/h a partir de pulsos eléctricos',
              'Usar interrupciones (interrupts) en Python con gpiozero para detectar pulsos sin bloquear el programa',
              'Conectar el sensor BME280 (ya armado en la Fase 1) para que conviva con los nuevos componentes',
              'Arma el circuito de alimentación solar: panel → TP4056 → batería Li-Ion → Raspberry Pi',
              'Medir el voltaje de la batería con un divisor de voltaje usando dos resistencias de 10 kΩ',
              'Crear el script principal que lee todos los sensores cada 60 segundos y entrega los datos en formato JSON',
              'Probar la estación completa en exterior durante una hora para validar lecturas, carga solar y alcance WiFi',
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
                  ['1', 'Raspberry Pi Zero 2 W (con microSD ya configurada de Fase 1)', '—'],
                  ['1', 'Anemómetro de reed switch (Sparkfun / InSpeed)', '~$1,500'],
                  ['1', 'Sensor BME280 (ya conectado de Fase 1)', '—'],
                  ['1', 'Panel solar 5W 12V', '~$400'],
                  ['1', 'Módulo TP4056 con protección de carga', '~$60'],
                  ['1', 'Batería Li-Ion 18650 (3.7V, ≥2500 mAh)', '~$120'],
                  ['2', 'Resistencias de 10 kΩ (1/4 W)', '~$5'],
                  ['1', 'Protoboard de 400 puntos', '~$80'],
                  ['10', 'Jumpers macho-hembra y macho-macho', '~$60'],
                  ['1', 'Multímetro digital (para medir voltajes)', '~$200'],
                  ['1', 'Portapilas 18650 (o soporte con cables)', '~$40'],
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
                  <td className="py-6 pr-8 text-lg font-serif text-[#1b4235]" colSpan={2}>Total materiales Fase 2 (adicional a Fase 1)</td>
                  <td className="py-6 text-right text-lg font-serif text-[#1b4235]">~$2,465 MXN</td>
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

          {/* Única sesión */}
          <div>
            <h3 className="font-serif text-3xl text-[#1b4235] mb-2">Sesión única: Ensamblaje completo del prototipo</h3>
            <p className="text-sm text-[#5c3d2e]/70 mb-10">
              Una sesión intensiva de ~6 horas. Al terminar, tendrás una estación meteorológica funcional alimentada por sol.
            </p>

            <div className="space-y-12">
              {/* Paso 1: Conectar el anemómetro */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">1</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">Conectar el anemómetro</h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    El anemómetro es el sensor que mide la velocidad del viento. El modelo que usamos funciona con un{' '}
                    <strong>reed switch</strong>: un interruptor magnético que se cierra brevemente cada vez que las
                    cazoletas dan una vuelta completa. Cada cierre genera un pulso eléctrico que la Raspberry Pi
                    puede detectar por un pin GPIO.
                  </p>

                  <div className="bg-white p-6 rounded-lg border border-[#1b4235]/10">
                    <p className="font-medium text-[#1b4235] mb-3">📌 Principio del reed switch</p>
                    <p className="text-sm">
                      Dentro del anemómetro hay un imán que pasa frente a un interruptor de láminas metálicas (reed switch)
                      una vez por vuelta. El imán junta las láminas → se cierra el circuito → la Pi detecta el pulso.
                      Entre más rápido giran las cazoletas, más pulsos por segundo.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-[#1b4235]/10">
                    <p className="font-medium text-[#1b4235] mb-3">📌 Conexiones del anemómetro</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#1b4235]/10">
                          <th className="py-2 pr-4 text-left text-[#b88364]">Cable del anemómetro</th>
                          <th className="py-2 pr-4 text-left text-[#b88364]">Conectar a</th>
                          <th className="py-2 text-left text-[#b88364]">Pin GPIO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1b4235]/5">
                        <tr><td className="py-2 pr-4 font-medium">Cable 1 (señal)</td><td className="py-2 pr-4">Pin GPIO 17</td><td className="py-2">Pin 11</td></tr>
                        <tr><td className="py-2 pr-4 font-medium">Cable 2 (tierra)</td><td className="py-2 pr-4">GND</td><td className="py-2">Pin 9</td></tr>
                      </tbody>
                    </table>
                    <p className="text-xs text-[#5c3d2e]/60 mt-4">
                      Solo se necesitan 2 cables. El reed switch actúa como un botón normalmente abierto que se cierra con cada vuelta.
                      No requiere alimentación externa.
                    </p>
                  </div>

                  <p>
                    Para leer los pulsos usamos la bilbioteca <strong>gpiozero</strong>, que ya viene instalada en
                    Raspberry Pi OS. Configuramos el pin como un <strong>Button</strong> y usamos la función{' '}
                    <code className="bg-[#1b4235]/5 px-1.5 py-0.5 rounded text-sm font-mono">when_pressed</code> para
                    contar cada pulso.
                  </p>

                  <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-[#b88364] mb-3"># anemometro.py — Leer pulsos del anemómetro</p>
                    <p className="text-white"><span className="text-[#b88364]">from</span> gpiozero <span className="text-[#b88364]">import</span> Button</p>
                    <p className="text-white"><span className="text-[#b88364]">import</span> time</p>
                    <p className="text-white mt-2"><span className="text-white/50"># Configurar el pin GPIO 17 como entrada</span></p>
                    <p className="text-white">anemometro = Button(17, pull_up=<span className="text-[#b88364]">True</span>)</p>
                    <p className="text-white mt-2">pulsos = 0</p>
                    <p className="text-white mt-2"><span className="text-white/50"># Cada vez que el anemómetro da una vuelta, se suma 1</span></p>
                    <p className="text-white"><span className="text-[#b88364]">def</span> <span className="text-[#edd3c5]">contar_pulso</span>():</p>
                    <p className="text-white ml-4"><span className="text-[#b88364]">global</span> pulsos</p>
                    <p className="text-white ml-4">pulsos += 1</p>
                    <p className="text-white mt-2">anemometro.when_pressed = contar_pulso</p>
                    <p className="text-white mt-2"><span className="text-white/50"># Medir durante 5 segundos y calcular velocidad</span></p>
                    <p className="text-white"><span className="text-[#b88364]">while</span> <span className="text-[#b88364]">True</span>:</p>
                    <p className="text-white ml-4">pulsos = 0</p>
                    <p className="text-white ml-4">time.sleep(5)</p>
                    <p className="text-white ml-4">velocidad = pulsos * 2.4 / 5</p>
                    <p className="text-white ml-4">velocidad_kmh = velocidad * 3.6</p>
                    <p className="text-white ml-4">print(<span className="text-[#edd3c5]">f"Pulsos: </span><span className="text-white">{"{"}</span>pulsos<span className="text-white">{"}"}</span><span className="text-[#edd3c5]"> | Viento: </span><span className="text-white">{"{"}</span>velocidad_kmh:.1f<span className="text-white">{"}"}</span><span className="text-[#edd3c5]"> km/h"</span>)</p>
                  </div>

                  <div className="bg-[#edd3c5]/30 p-6 rounded-lg border border-[#b88364]/20">
                    <p className="font-medium text-[#1b4235] mb-2">🧮 ¿De dónde sale el 2.4?</p>
                    <p className="text-sm text-[#5c3d2e] leading-relaxed">
                      El anemómetro recorre 2.4 metros por cada vuelta (es una constante del fabricante; verifica la de tu modelo).
                      La fórmula completa es: <strong>velocidad (m/s) = pulsos × 2.4 / intervalo_en_segundos</strong>.
                      Para convertir a km/h multiplicas por 3.6.
                      Si tu anemómetro tiene otra constante, solo cambia ese número.
                    </p>
                  </div>

                  <div className="bg-[#edd3c5]/30 p-4 rounded-lg border border-[#b88364]/20">
                    <p className="text-sm text-[#5c3d2e]">
                      <strong>💡 Tip:</strong> Si no hay viento, sopla sobre las cazoletas o gíralas con la mano para
                      probar que el contador funciona. Verás los pulsos subir en la terminal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Paso 2: Energía solar autónoma */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">2</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">Energía solar autónoma</h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    Para que la estación funcione en el cerro sin acceso a electricidad, la alimentamos con un panel solar
                    que carga una batería durante el día. El circuito se basa en tres componentes:
                  </p>

                  <div className="bg-white p-6 rounded-lg border border-[#1b4235]/10">
                    <p className="font-medium text-[#1b4235] mb-4">📌 Diagrama del circuito solar</p>
                    <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                      <p className="text-[#edd3c5]">    ☀️ Panel Solar 5W</p>
                      <p className="text-[#edd3c5]">         │</p>
                      <p className="text-[#edd3c5]">    ┌────┴────┐</p>
                      <p className="text-[#edd3c5]">    │ TP4056  │  ← Controlador de carga</p>
                      <p className="text-[#edd3c5]">    └────┬────┘</p>
                      <p className="text-[#edd3c5]">         │</p>
                      <p className="text-[#edd3c5]">    ┌────┴────┐</p>
                      <p className="text-[#edd3c5]">    │  18650   │  ← Batería Li-Ion 3.7V</p>
                      <p className="text-[#edd3c5]">    └────┬────┘</p>
                      <p className="text-[#edd3c5]">         │</p>
                      <p className="text-[#edd3c5]">    ┌────┴────┐</p>
                      <p className="text-[#edd3c5]">    │ 5V Boost │  ← Elevador a 5V</p>
                      <p className="text-[#edd3c5]">    └────┬────┘</p>
                      <p className="text-[#edd3c5]">         │</p>
                      <p className="text-[#edd3c5]">    ┌────┴────┐</p>
                      <p className="text-[#edd3c5]">    │   RPi    │  ← Raspberry Pi</p>
                      <p className="text-[#edd3c5]">    └─────────┘</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white p-5 rounded-lg border border-[#1b4235]/5">
                      <p className="font-medium text-[#1b4235] mb-1">1. Panel solar → TP4056</p>
                      <p className="text-sm">
                        El panel solar de 5W entrega entre 5V y 12V dependiendo del sol. El TP4056 es un controlador de carga
                        que toma ese voltaje variable y lo regula para cargar la batería de forma segura.
                        <strong> Conecta los cables del panel a las terminales IN+ e IN− del TP4056</strong>.
                      </p>
                    </div>
                    <div className="bg-white p-5 rounded-lg border border-[#1b4235]/5">
                      <p className="font-medium text-[#1b4235] mb-1">2. TP4056 → Batería 18650</p>
                      <p className="text-sm">
                        El TP4056 tiene terminales BAT+ y BAT−. Conéctalas al portapilas de la batería 18650{' '}
                        <strong>respetando la polaridad: rojo a +, negro a −</strong>. El TP4056 protege contra
                        sobrecarga, sobredescarga y cortocircuito.
                      </p>
                    </div>
                    <div className="bg-white p-5 rounded-lg border border-[#1b4235]/5">
                      <p className="font-medium text-[#1b4235] mb-1">3. Batería → Módulo elevador 5V → Raspberry Pi</p>
                      <p className="text-sm">
                        La batería 18650 entrega ~3.7V, pero la Pi necesita 5V estables. Un módulo elevador (boost converter)
                        o las salidas OUT+/OUT− del TP4056 (que entregan el voltaje de batería) se conectan a la Pi.
                        Para simplificar, puedes usar un power bank que ya integra TP4056 + elevador + 18650.
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#edd3c5]/30 p-6 rounded-lg border border-[#b88364]/20">
                    <p className="font-medium text-[#1b4235] mb-2">⚠️ ¡Precaución!</p>
                    <p className="text-sm text-[#5c3d2e] leading-relaxed">
                      <strong>Nunca conectes el panel solar directamente a la Raspberry Pi.</strong> El voltaje del panel
                      varía con el sol y puede dañar la Pi o la batería. El TP4056 es indispensable: regula la carga,
                      corta cuando la batería está llena y protege todo el circuito. Cuestan menos de $60 MXN y son el
                      seguro de vida de tu estación.
                    </p>
                  </div>
                </div>
              </div>

              {/* Paso 3: Monitoreo de batería */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">3</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">Monitoreo de batería</h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    Saber cuánta carga le queda a la batería es clave para una estación remota. Usamos un{' '}
                    <strong>divisor de voltaje</strong> con dos resistencias iguales para bajar el voltaje de la batería
                    (~4.2V cuando está llena) a la mitad (~2.1V), que es seguro para los pines GPIO (máximo 3.3V).
                  </p>

                  <div className="bg-white p-6 rounded-lg border border-[#1b4235]/10">
                    <p className="font-medium text-[#1b4235] mb-3">📌 Conexiones del divisor de voltaje</p>
                    <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                      <p className="text-[#edd3c5]">   Batería (+)</p>
                      <p className="text-[#edd3c5]">       │</p>
                      <p className="text-[#edd3c5]">      ┌┴┐</p>
                      <p className="text-[#edd3c5]">      │ │ R1 = 10kΩ</p>
                      <p className="text-[#edd3c5]">      └┬┘</p>
                      <p className="text-[#edd3c5]">       ├──── Pin GPIO (lectura ~2.1V)</p>
                      <p className="text-[#edd3c5]">      ┌┴┐</p>
                      <p className="text-[#edd3c5]">      │ │ R2 = 10kΩ</p>
                      <p className="text-[#edd3c5]">      └┬┘</p>
                      <p className="text-[#edd3c5]">       │</p>
                      <p className="text-[#edd3c5]">   Batería (−) / GND</p>
                    </div>
                    <p className="text-xs text-[#5c3d2e]/60 mt-4">
                      V<sub>lectura</sub> = V<sub>batería</sub> × R2 / (R1 + R2). Si R1 = R2 = 10kΩ, entonces V<sub>lectura</sub> = V<sub>batería</sub> / 2.
                      En el código multiplicamos la lectura × 2 para obtener el voltaje real.
                    </p>
                  </div>

                  <p>
                    La Raspberry Pi <strong>no tiene entradas analógicas</strong>. Para leer el voltaje real necesitamos
                    un ADC (convertidor analógico-digital) como el MCP3008. Pero para esta fase usamos una alternativa
                    más simple:
                  </p>

                  <div className="bg-white p-5 rounded-lg border border-[#1b4235]/5">
                    <p className="font-medium text-[#1b4235] mb-1">🔋 Método simplificado (sin ADC)</p>
                    <p className="text-sm">
                      El MCP3008 se cubre en la Fase 3. Por ahora, monitoreamos la batería de dos formas prácticas:
                      (1) El LED del TP4056 indica estado de carga (rojo = cargando, azul/verde = lleno), y (2) medimos
                      el voltaje con el multímetro entre BAT+ y BAT− del TP4056. Anota el voltaje cada 15 minutos
                      durante la prueba exterior para ver cómo se comporta la batería.
                    </p>
                  </div>

                  <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-[#b88364] mb-3"># bateria.py — Monitoreo con MCP3008 (Fase 3 adelanto)</p>
                    <p className="text-white"><span className="text-[#b88364]">import</span> time</p>
                    <p className="text-white mt-2"><span className="text-white/50"># Método temporal: medir con multímetro y registrar manual</span></p>
                    <p className="text-white">print(<span className="text-[#edd3c5]">"⏱️  Mide el voltaje de la batería con el multímetro:"</span>)</p>
                    <p className="text-white">print(<span className="text-[#edd3c5]">"    Punta roja → BAT+ del TP4056"</span>)</p>
                    <p className="text-white">print(<span className="text-[#edd3c5]">"    Punta negra → BAT- del TP4056"</span>)</p>
                    <p className="text-white">print(<span className="text-[#edd3c5]">"    Anota el voltaje cada 15 min durante la prueba exterior."</span>)</p>
                    <p className="text-white mt-2"><span className="text-white/50"># Rangos típicos de una 18650:</span></p>
                    <p className="text-white"><span className="text-white/50"># 4.2V = 100% | 3.7V = 50% | 3.2V = 15% | 3.0V = ¡recargar ya!</span></p>
                  </div>
                </div>
              </div>

              {/* Paso 4: El script principal */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">4</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">El script principal</h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    Este es el corazón de la estación. Un solo script en Python que cada 60 segundos:
                    lee el BME280 (temperatura, humedad, presión), cuenta los pulsos del anemómetro,
                    calcula la velocidad del viento y entrega todo en formato JSON listo para enviar.
                  </p>

                  <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-[#b88364] mb-3"># estacion.py — Script principal de la estación meteorológica</p>
                    <p className="text-white"><span className="text-[#b88364]">import</span> time</p>
                    <p className="text-white"><span className="text-[#b88364]">import</span> json</p>
                    <p className="text-white"><span className="text-[#b88364]">import</span> smbus2</p>
                    <p className="text-white"><span className="text-[#b88364]">import</span> bme280</p>
                    <p className="text-white"><span className="text-[#b88364]">from</span> gpiozero <span className="text-[#b88364]">import</span> Button</p>
                    <p className="text-white"><span className="text-[#b88364]">from</span> datetime <span className="text-[#b88364]">import</span> datetime</p>
                    <p className="text-white mt-2"><span className="text-white/50"># ── Configuración ─────────────────────────────</span></p>
                    <p className="text-white">INTERVALO = 60          <span className="text-white/50"># segundos entre lecturas</span></p>
                    <p className="text-white">FACTOR_ANEMOMETRO = 2.4  <span className="text-white/50"># metros por pulso (verifica tu modelo)</span></p>
                    <p className="text-white">NOMBRE_ESTACION = <span className="text-[#edd3c5]">"hangar5-prototipo"</span></p>
                    <p className="text-white mt-2"><span className="text-white/50"># ── Inicializar sensores ─────────────────────</span></p>
                    <p className="text-white">bus = smbus2.SMBus(1)</p>
                    <p className="text-white">calibracion = bme280.load_calibration_params(bus, 0x76)</p>
                    <p className="text-white">anemometro = Button(17, pull_up=<span className="text-[#b88364]">True</span>)</p>
                    <p className="text-white">pulsos_viento = 0</p>
                    <p className="text-white mt-2"><span className="text-[#b88364]">def</span> <span className="text-[#edd3c5]">pulso</span>():</p>
                    <p className="text-white ml-4"><span className="text-[#b88364]">global</span> pulsos_viento</p>
                    <p className="text-white ml-4">pulsos_viento += 1</p>
                    <p className="text-white mt-2">anemometro.when_pressed = pulso</p>
                    <p className="text-white mt-2">print(<span className="text-[#edd3c5]">f"🌤️  Estación </span><span className="text-white">{"{"}</span>NOMBRE_ESTACION<span className="text-white">{"}"}</span><span className="text-[#edd3c5]"> iniciada. Lecturas cada </span><span className="text-white">{"{"}</span>INTERVALO<span className="text-white">{"}"}</span><span className="text-[#edd3c5]">s."</span>)</p>
                    <p className="text-white">print(<span className="text-[#edd3c5]">"-"</span> * 50)</p>
                    <p className="text-white mt-2"><span className="text-[#b88364]">while</span> <span className="text-[#b88364]">True</span>:</p>
                    <p className="text-white ml-4"><span className="text-white/50"># Leer BME280</span></p>
                    <p className="text-white ml-4">datos = bme280.sample(bus, 0x76, calibracion)</p>
                    <p className="text-white ml-4">pulsos = pulsos_viento</p>
                    <p className="text-white ml-4">pulsos_viento = 0</p>
                    <p className="text-white mt-2 ml-4"><span className="text-white/50"># Calcular viento</span></p>
                    <p className="text-white ml-4">viento_ms = pulsos * FACTOR_ANEMOMETRO / INTERVALO</p>
                    <p className="text-white ml-4">viento_kmh = viento_ms * 3.6</p>
                    <p className="text-white mt-2 ml-4"><span className="text-white/50"># Construir JSON</span></p>
                    <p className="text-white ml-4">payload = {"{"}</p>
                    <p className="text-white ml-8"><span className="text-[#edd3c5]">"estacion"</span>: NOMBRE_ESTACION,</p>
                    <p className="text-white ml-8"><span className="text-[#edd3c5]">"timestamp"</span>: datetime.now().isoformat(),</p>
                    <p className="text-white ml-8"><span className="text-[#edd3c5]">"temperatura_c"</span>: round(datos.temperatura, 1),</p>
                    <p className="text-white ml-8"><span className="text-[#edd3c5]">"humedad_pct"</span>: round(datos.humedad, 1),</p>
                    <p className="text-white ml-8"><span className="text-[#edd3c5]">"presion_hpa"</span>: round(datos.presion, 1),</p>
                    <p className="text-white ml-8"><span className="text-[#edd3c5]">"viento_kmh"</span>: round(viento_kmh, 1),</p>
                    <p className="text-white ml-8"><span className="text-[#edd3c5]">"viento_pulsos"</span>: pulsos</p>
                    <p className="text-white ml-4">{"}"}</p>
                    <p className="text-white mt-2 ml-4">print(json.dumps(payload, indent=2, ensure_ascii=<span className="text-[#b88364]">False</span>))</p>
                    <p className="text-white ml-4">time.sleep(INTERVALO)</p>
                  </div>

                  <p>Ejecútalo y observa la salida:</p>

                  <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-white">python3 estacion.py</p>
                    <p className="text-white/70 mt-2"># Salida de ejemplo:</p>
                    <p className="text-[#edd3c5]">{"{"}</p>
                    <p className="text-[#edd3c5] ml-4">"estacion": "hangar5-prototipo",</p>
                    <p className="text-[#edd3c5] ml-4">"timestamp": "2026-06-12T16:42:00",</p>
                    <p className="text-[#edd3c5] ml-4">"temperatura_c": 24.1,</p>
                    <p className="text-[#edd3c5] ml-4">"humedad_pct": 48.3,</p>
                    <p className="text-[#edd3c5] ml-4">"presion_hpa": 779.8,</p>
                    <p className="text-[#edd3c5] ml-4">"viento_kmh": 12.3,</p>
                    <p className="text-[#edd3c5] ml-4">"viento_pulsos": 71</p>
                    <p className="text-[#edd3c5]">{"}"}</p>
                  </div>

                  <div className="bg-[#edd3c5]/30 p-6 rounded-lg border border-[#b88364]/20">
                    <p className="font-medium text-[#1b4235] mb-2">💡 ¿Por qué JSON?</p>
                    <p className="text-sm text-[#5c3d2e] leading-relaxed">
                      JSON (JavaScript Object Notation) es el formato universal para intercambiar datos en internet.
                      En la Fase 3 aprenderás a enviar este mismo JSON a un servidor por HTTP para visualizarlo
                      en tiempo real desde cualquier parte del mundo. Por ahora, verlo en la terminal ya es un gran paso.
                    </p>
                  </div>

                  <div className="bg-[#edd3c5]/30 p-4 rounded-lg border border-[#b88364]/20">
                    <p className="text-sm text-[#5c3d2e]">
                      <strong>💡 Tip:</strong> Cambia <code className="bg-[#1b4235]/5 px-1.5 py-0.5 rounded text-sm font-mono">INTERVALO = 5</code> durante las pruebas
                      para ver resultados más rápido. Vuelve a 60 cuando esté funcionando en serio.
                    </p>
                  </div>
                </div>
              </div>

              {/* Paso 5: Probar en exterior */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">5</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">Probar en exterior</h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    El momento de la verdad. Saca todo el prototipo al exterior durante al menos una hora.
                    Esto te permite validar tres cosas esenciales:
                  </p>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-lg border border-[#1b4235]/5">
                      <p className="text-[#b88364] text-xs tracking-wider uppercase mb-2">Carga solar</p>
                      <p className="text-sm">
                        Coloca el panel al sol directo. Verifica que el LED del TP4056 se encienda en rojo (cargando).
                        Mide el voltaje de la batería con el multímetro al inicio y al final: ¿subió?
                      </p>
                    </div>
                    <div className="bg-white p-5 rounded-lg border border-[#1b4235]/5">
                      <p className="text-[#b88364] text-xs tracking-wider uppercase mb-2">Lecturas coherentes</p>
                      <p className="text-sm">
                        Compara la temperatura con un termómetro o tu celular. Sopla las cazoletas del anemómetro
                        y verifica que el contador de pulsos suba. ¿La presión es razonable para tu altitud?
                      </p>
                    </div>
                    <div className="bg-white p-5 rounded-lg border border-[#1b4235]/5">
                      <p className="text-[#b88364] text-xs tracking-wider uppercase mb-2">Alcance WiFi</p>
                      <p className="text-sm">
                        Aléjate con la Pi del router. ¿Hasta dónde llega la señal? Esto te dice si necesitarás
                        un repetidor o módem 4G para la instalación definitiva en el cerro.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-[#1b4235]/10">
                    <p className="font-medium text-[#1b4235] mb-2">📋 Checklist de prueba exterior</p>
                    <ul className="text-sm space-y-2 text-[#5c3d2e]">
                      <li className="flex items-center gap-2">
                        <span className="text-[#b88364]">☐</span> Panel solar orientado al sur (en hemisferio norte) y sin sombras
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#b88364]">☐</span> TP4056 indica carga (LED rojo) cuando hay sol
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#b88364]">☐</span> Voltaje de batería sube después de 30+ minutos al sol
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#b88364]">☐</span> Script <code className="bg-[#1b4235]/5 px-1.5 py-0.5 rounded text-sm font-mono">estacion.py</code> corre sin errores por al menos 30 minutos
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#b88364]">☐</span> JSON de salida tiene todos los campos con valores razonables
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#b88364]">☐</span> Temperatura y humedad coinciden aproximadamente con otra referencia
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#b88364]">☐</span> Anemómetro registra pulsos al mover las cazoletas
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#b88364]">☐</span> Conexión WiFi se mantiene estable desde la ubicación de prueba
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#b88364]">☐</span> Tomaste fotos de todo el montaje (útil para documentar y depurar)
                      </li>
                    </ul>
                  </div>

                  <div className="bg-[#edd3c5]/30 p-4 rounded-lg border border-[#b88364]/20">
                    <p className="text-sm text-[#5c3d2e]">
                      <strong>💡 Tip para el instructor:</strong> Si varias personas están probando al mismo tiempo,
                      organicen una "carrera de estaciones": ¿quién registra la ráfaga de viento más alta?
                      ¿Quién tiene la lectura de temperatura más estable? El juego mantiene el interés mientras
                      se recolectan datos reales.
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
            href="/comunidad/fase-1-electronica"
            className="group flex items-center gap-4 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          >
            <span className="text-2xl group-hover:-translate-x-1 transition-transform">←</span>
            <div>
              <p className="text-xs text-[#b88364] tracking-wider uppercase">Anterior</p>
              <p className="text-lg font-serif">Fase 1: Electrónica Básica</p>
            </div>
          </Link>
          <Link
            href="/comunidad/fase-3-programacion"
            className="group flex items-center gap-4 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          >
            <div className="text-right">
              <p className="text-xs text-[#b88364] tracking-wider uppercase">Siguiente</p>
              <p className="text-lg font-serif">Fase 3: Programación</p>
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
