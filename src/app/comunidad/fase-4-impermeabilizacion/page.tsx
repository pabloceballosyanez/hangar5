import Link from 'next/link';
import CursoNav from '../CursoNav';

export const metadata = {
  title: 'Fase 4: Impermeabilización y Montaje — Red Meteorológica Comunitaria',
  description: 'De protoboard al campo: aprende a soldar, impermeabilizar tu estación meteorológica y montarla en un mástil lista para la intemperie.',
};

export default function Fase4Page() {
  return (
    <main className="min-h-screen bg-[#faf7f5]">
      <CursoNav fase={4} />

      {/* Hero */}
      <section className="relative py-32 bg-[#1b4235] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/img/paisaje.jpg')] bg-cover bg-center" />
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">Fase 4 · 1 sesión</p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.1] mb-6 tracking-[-0.02em]">
            Impermeabilización<br /><span className="italic">&amp; Montaje</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Es hora de sacar tu estación del laboratorio. Aprenderás a soldar, montar todo en un gabinete
            a prueba de agua, instalar el mástil y dejar tu estación lista para vivir a la intemperie.
            De protoboard al campo en una sola sesión.
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
              'Fundamentos de soldadura: estañar la punta, calentar la unión, aplicar el estaño',
              'Transferir tu circuito de la protoboard a una placa perforada (perfboard) con soldadura',
              'Perforar el gabinete IP65 para pasar los cables con prensaestopas',
              'Montar el panel solar al ángulo correcto de inclinación (~34° para México)',
              'Impermeabilizar todas las conexiones con silicón y termocontraíble',
              'Montar el anemómetro en el mástil y asegurarlo contra el viento',
              'Fijar el gabinete al mástil con abrazaderas y colocar silica gel contra la humedad',
              'Probar la impermeabilización con una cubeta de agua (¡no manguera!)',
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
                  ['1', 'Placa perforada (perfboard) 5×7 cm o similar', '~$40'],
                  ['1', 'Cautín de 30W–40W + estaño 60/40', '~$200'],
                  ['1', 'Tubo de termocontraíble surtido', '~$60'],
                  ['1', 'Silicón sellador transparente (100% silicón)', '~$80'],
                  ['1', 'Gabinete IP65 (200×150×100 mm aprox.)', '~$350'],
                  ['3', 'Prensaestopas PG7 + tuerca', '~$90'],
                  ['3', 'Prensaestopas PG9 + tuerca', '~$100'],
                  ['1', 'Tubo de PVC 2 m × 50 mm (diámetro)', '~$180'],
                  ['2', 'Abrazaderas en U (U-bolts) 2" con placas', '~$120'],
                  ['1', 'Paquete de bridas plásticas (zip ties) 20 cm', '~$50'],
                  ['5', 'Sobres de silica gel desecante (10 g c/u)', '~$40'],
                  ['1', 'Separadores (standoffs) M2.5 para Raspberry Pi', '~$50'],
                  ['1', 'Cinta aislante líquida (opcional)', '~$70'],
                  ['1', 'Barrenas escalonadas o brocas HSS para metal', '~$150'],
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
                  <td className="py-6 pr-8 text-lg font-serif text-[#1b4235]" colSpan={2}>Total materiales Fase 4</td>
                  <td className="py-6 text-right text-lg font-serif text-[#1b4235]">~$1,580 MXN</td>
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

          {/* Sesión única */}
          <div>
            <h3 className="font-serif text-3xl text-[#1b4235] mb-8">
              Sesión única: Del prototipo al campo
            </h3>

            <div className="space-y-12">
              {/* Paso 1 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">1</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">
                    De protoboard a placa perforada
                  </h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    El protoboard es excelente para experimentar, pero no sobrevive a la intemperie:
                    las conexiones se aflojan con las vibraciones, la humedad oxida los contactos y
                    un golpe de viento puede desconectar todo. Vamos a transferir el circuito a una
                    placa perforada con soldaduras permanentes.
                  </p>

                  <div className="bg-[#edd3c5]/30 p-6 rounded-lg border border-[#b88364]/20">
                    <p className="font-medium text-[#1b4235] mb-3">🧑‍🏫 Mini-tutorial de soldadura</p>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium text-[#5c3d2e] mb-1">① Estañar la punta</p>
                        <p className="text-[#5c3d2e]">Con el cautín caliente, aplica una pequeña gota de estaño directamente en la punta. Esto mejora la transferencia de calor. Limpia el exceso en la esponja húmeda.</p>
                      </div>
                      <div>
                        <p className="font-medium text-[#5c3d2e] mb-1">② Calentar la unión</p>
                        <p className="text-[#5c3d2e]">Apoya la punta del cautín sobre <em>ambas</em> superficies a unir (el pin del componente y la pista de cobre de la placa). Cuenta 2–3 segundos.</p>
                      </div>
                      <div>
                        <p className="font-medium text-[#5c3d2e] mb-1">③ Aplicar el estaño</p>
                        <p className="text-[#5c3d2e]">Toca la <em>unión caliente</em> con el estaño, no la punta del cautín. El estaño debe fluir como miel alrededor del pin formando un cono brillante. Retira el cautín y no muevas la pieza por 3 segundos.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#edd3c5]/30 p-6 rounded-lg border border-[#b88364]/20">
                    <p className="font-medium text-[#1b4235] mb-2">⚠️ Seguridad al soldar</p>
                    <ul className="text-sm space-y-1 text-[#5c3d2e]">
                      <li>• Trabaja en un área bien ventilada (el humo de resina no es tóxico, pero irrita).</li>
                      <li>• El cautín alcanza ~350°C. <strong>Nunca toques la punta metálica.</strong></li>
                      <li>• Sujeta el cautín por el mango aislado. Déjalo en su base cuando no lo uses.</li>
                      <li>• Lávate las manos después de soldar (el estaño contiene plomo en aleaciones 60/40).</li>
                      <li>• Usa lentes de seguridad: a veces el estaño salpica al cortar excesos.</li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-[#1b4235]/10">
                    <p className="font-medium text-[#1b4235] mb-3">📋 Procedimiento de transferencia</p>
                    <ol className="text-sm space-y-2 text-[#5c3d2e] list-decimal list-inside">
                      <li>Dibuja en papel la posición de cada componente copiando tu protoboard.</li>
                      <li>Coloca los componentes en la perfboard: el BME280, las resistencias pull-up (si las usas), los headers para la Pi.</li>
                      <li>Suelda pin por pin, verificando que no haya <strong>puentes fríos</strong> (soldadura opaca y granulada = mala conexión; debe verse brillante).</li>
                      <li>Corta los excesos de pata con pinzas de corte al ras.</li>
                      <li>Usa un multímetro en modo continuidad para verificar que las conexiones son correctas y no hay cortos.</li>
                      <li>Conecta la placa soldada a la Raspberry Pi y ejecuta <code className="bg-[#1b4235] text-[#edd3c5] px-2 py-0.5 rounded text-xs font-mono">python3 clima.py</code> para confirmar que todo funciona igual que en protoboard.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Paso 2 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">2</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">
                    Preparar el gabinete
                  </h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    El gabinete es la casa de tu estación. Necesita proteger la electrónica de la lluvia,
                    el polvo y los insectos, pero también permitir que los cables de los sensores externos
                    entren de forma sellada.
                  </p>

                  <div className="bg-white p-6 rounded-lg border border-[#1b4235]/10">
                    <p className="font-medium text-[#1b4235] mb-2">🔒 ¿Qué significa IP65?</p>
                    <p className="text-sm text-[#5c3d2e] mb-3">
                      El código IP (Ingress Protection) tiene dos dígitos. El primero es protección contra sólidos
                      (polvo), el segundo contra líquidos (agua):
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-[#faf7f5] p-4 rounded-lg">
                        <p className="font-medium text-[#b88364] mb-1">IP6_ = "Estanco al polvo"</p>
                        <p className="text-[#5c3d2e]">No entra absolutamente nada de polvo. La junta de silicona del gabinete sella completamente.</p>
                      </div>
                      <div className="bg-[#faf7f5] p-4 rounded-lg">
                        <p className="font-medium text-[#b88364] mb-1">IP_5 = "Chorros de agua"</p>
                        <p className="text-[#5c3d2e]">Soporta chorros de agua desde cualquier dirección. Lluvia fuerte = sin problema. Inmersión = no.</p>
                      </div>
                    </div>
                  </div>

                  <p className="font-medium text-[#1b4235] mt-2">Procedimiento:</p>
                  <ol className="text-sm space-y-3 text-[#5c3d2e] list-decimal list-inside ml-2">
                    <li>
                      <strong>Perfora los orificios para prensaestopas.</strong> Marca con plumón en las caras
                      inferior o laterales del gabinete los puntos donde entrarán los cables (anemómetro, sensor
                      BME280 exterior, panel solar). Usa una barrena escalonada — empieza con la broca más pequeña
                      y ve ampliando hasta el diámetro del prensaestopas. <strong>Nunca perfores la cara superior</strong>:
                      el agua se acumularía y encontraría el camino hacia adentro.
                    </li>
                    <li>
                      <strong>Monta la Raspberry Pi.</strong> Atornilla los separadores M2.5 a la base del gabinete.
                      Si tu gabinete es de plástico, usa tornillos autorroscantes pequeños. La Pi debe quedar elevada
                      ~5 mm para que el aire circule y cualquier condensación no toque la placa.
                    </li>
                    <li>
                      <strong>Coloca el silica gel.</strong> Pega 2–3 sobres de silica gel desecante en el interior
                      del gabinete (en la tapa es buen lugar). Absorberán la humedad que entre al abrir o por
                      cambios de temperatura. <strong>Importante:</strong> los sobres se saturan con el tiempo.
                      Cámbialos cada 3–4 meses o sécalos en horno a 100°C por 2 horas.
                    </li>
                    <li>
                      <strong>Fija el cableado interno.</strong> Usa bridas pequeñas o bases adhesivas para organizar
                      los cables. Un gabinete ordenado es más fácil de reparar y disipa mejor el calor.
                    </li>
                  </ol>

                  <div className="bg-[#edd3c5]/30 p-6 rounded-lg border border-[#b88364]/20">
                    <p className="font-medium text-[#1b4235] mb-2">💡 Tip: La ventilación es clave</p>
                    <p className="text-sm text-[#5c3d2e]">
                      En climas húmedos como El Peñón, la condensación dentro del gabinete es un riesgo real.
                      Si puedes, instala una válvula de ventilación (respiradero) Gore-Tex en la parte inferior
                      del gabinete. Deja pasar vapor de agua pero no líquido. Cuestan ~$80 MXN y salvan
                      electrónica. Alternativa casera: un pequeño orificio en la parte inferior cubierto con tela
                      transpirable asegurada con silicón.
                    </p>
                  </div>
                </div>
              </div>

              {/* Paso 3 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">3</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">
                    Conectar los sensores externos
                  </h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    No todos los sensores van dentro del gabinete. El anemómetro debe estar expuesto al viento,
                    y el sensor de temperatura/humedad necesita estar a la sombra y bien ventilado para no
                    falsear las lecturas.
                  </p>

                  <div className="bg-white p-6 rounded-lg border border-[#1b4235]/10">
                    <p className="font-medium text-[#1b4235] mb-3">🌬️ Cable del anemómetro</p>
                    <ol className="text-sm space-y-2 text-[#5c3d2e] list-decimal list-inside">
                      <li>Pasa el cable del anemómetro por un prensaestopas PG7 o PG9 en la cara inferior.</li>
                      <li>Deja ~20 cm de cable dentro del gabinete para trabajar con holgura.</li>
                      <li>Pela las puntas y suéldalas a la placa perforada según las conexiones que definiste en Fase 2.</li>
                      <li>Ajusta la tuerca del prensaestopas hasta que la goma selle firmemente alrededor del cable. No uses silicón en el prensaestopas: la goma ya hace el sello.</li>
                    </ol>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-[#1b4235]/10">
                    <p className="font-medium text-[#1b4235] mb-3">🌡️ Sensor BME280 exterior</p>
                    <p className="text-sm text-[#5c3d2e]">
                      Si tu BME280 va dentro del gabinete, las lecturas de temperatura serán incorrectas:
                      la Raspberry Pi genera calor (~40–50°C dentro). La solución es montar el BME280 en un
                      pequeño <strong>abrigo Stevenson</strong>: una caja ventilada que bloquea la radiación solar
                      directa pero permite que el aire circule libremente.
                    </p>
                    <div className="bg-[#faf7f5] p-4 rounded-lg mt-3 text-sm text-[#5c3d2e]">
                      <p className="font-medium text-[#b88364] mb-1">Opción casera:</p>
                      <p>
                        Usa platos de plástico blanco apilados con separadores (como un hongo invertido),
                        o una caja de helado con agujeros. El sensor se monta en el centro, protegido del sol
                        pero con ventilación total. El cable baja por dentro del mástil o por fuera protegido
                        con tubo corrugado hasta el gabinete.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-[#1b4235]/10">
                    <p className="font-medium text-[#1b4235] mb-3">☀️ Cable del panel solar</p>
                    <ol className="text-sm space-y-2 text-[#5c3d2e] list-decimal list-inside">
                      <li>Pasa el cable del panel solar por otro prensaestopas.</li>
                      <li>Conecta los cables positivo y negativo al regulador de carga o al módulo de alimentación.</li>
                      <li>Asegúrate de que el cable tenga un <strong>lazo de goteo</strong>: que baje un poco antes de subir al gabinete, para que el agua escurra hacia abajo en lugar de seguir el cable hasta adentro.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Paso 4 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">4</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">
                    El mástil y la orientación
                  </h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    El mástil es la columna vertebral de la estación. Debe ser estable, resistente al viento
                    y colocar cada componente en la posición correcta. Para nuestro proyecto usamos un
                    tubo de PVC de 2 metros × 50 mm, económico y fácil de trabajar.
                  </p>

                  <div className="bg-white p-6 rounded-lg border border-[#1b4235]/10">
                    <p className="font-medium text-[#1b4235] mb-3">📐 Cálculo del ángulo del panel solar</p>
                    <p className="text-sm text-[#5c3d2e] mb-2">
                      Para maximizar la captación solar, el panel debe inclinarse según tu latitud.
                      En México (~19°N para la CDMX y zona centro), la regla óptima para invierno es:
                    </p>
                    <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm mb-3 text-center">
                      <p className="text-[#b88364]">Ángulo del panel = latitud + 15°</p>
                      <p className="text-2xl mt-2">19° + 15° = <span className="text-[#edd3c5] font-bold">~34°</span></p>
                      <p className="text-white/50 text-xs mt-1">desde la horizontal, orientado hacia el SUR</p>
                    </div>
                    <p className="text-sm text-[#5c3d2e]">
                      En verano puedes reducir el ángulo (latitud − 15° ≈ 4°) para captar más sol del cenit.
                      Si no puedes ajustar, los 34° son un excelente compromiso anual para el centro de México.
                      Un panel a 34° además se autolimpia mejor con la lluvia.
                    </p>
                  </div>

                  <p className="font-medium text-[#1b4235]">Montaje paso a paso:</p>
                  <ol className="text-sm space-y-3 text-[#5c3d2e] list-decimal list-inside ml-2">
                    <li>
                      <strong>Fija el tubo de PVC.</strong> Entiérralo al menos 40 cm en el suelo y compacta bien la tierra, o fíjalo a una estructura existente (poste, pared, reja) usando abrazaderas en U. Si usas concreto, prepara una base de 30×30×40 cm y deja curar 24 horas.
                    </li>
                    <li>
                      <strong>Asegura que quede a plomo.</strong> Usa un nivel de burbuja. Un mástil torcido distorsiona la dirección del viento en el anemómetro.
                    </li>
                    <li>
                      <strong>Instala el anemómetro en la punta.</strong> Es el sensor que debe ir más alto, a mínimo 1 metro por encima de cualquier obstáculo cercano. Fíjalo con las bridas plásticas a una reducción de PVC o a un soporte metálico. Verifica que gire libremente.
                    </li>
                    <li>
                      <strong>Monta el panel solar.</strong> Usa un soporte casero con ángulo de ~34° orientado al SUR geográfico (no magnético). En México, el sur geográfico está ~6° al este del sur magnético. Usa la brújula de tu celular ajustada a Norte Verdadero, o simplemente apunta hacia donde da el sol al mediodía.
                    </li>
                    <li>
                      <strong>Sujeta el gabinete al mástil.</strong> Colócalo debajo del panel solar para que el panel le dé sombra (reduce la temperatura interna hasta 15°C). Usa abrazaderas en U con placas para PVC: dos arriba y dos abajo. No aprietes demasiado o el PVC se deforma.
                    </li>
                    <li>
                      <strong>Fija todos los cables con bridas.</strong> Los cables sueltos se mueven con el viento, desgastan el aislamiento y pueden desconectarse. Recógelos en espiral o siguiendo el mástil, con bridas cada 30 cm.
                    </li>
                  </ol>

                  {/* Diagrama ASCII del montaje */}
                  <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-[#b88364] mb-4 text-xs tracking-[0.2em] uppercase">Diagrama de montaje</p>
                    <pre className="text-white/90">
{`                        ⊗  ← Anemómetro (velocidad + dirección)
                        │     en la punta del mástil
                        │
                   ╱ ☀️ ╲  ← Panel solar a ~34°
                  ╱        ╲    orientado al SUR
                 ╱    PV    ╲
                ╱____________╲
                        │
                        │  ← Mástil PVC 2m × 50mm
                        │
                   ┌─────────┐
                   │ 🌡️💧   │  ← Abrigo Stevenson
                   │ BME280  │     (sensor exterior)
                   └─────────┘
                        │
                   ╔═════════╗  ← Gabinete IP65
                   ║ RasPi   ║     (bajo sombra del panel)
                   ║ + placa ║
                   ║ + silica║
                   ╚══╤══╤══╝
                 ─────┘  └─────  ← Lazo de goteo en cables
                        │
              ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← Tierra / base de concreto
              ▓▓  40 cm   ▓▓▓
              ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
`}</pre>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/60">
                      <div className="flex gap-2">
                        <span className="text-[#b88364]">⊗</span> Anemómetro — el sensor más alto, viento libre
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[#b88364]">☀️</span> Panel solar — sur, 34° de inclinación
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[#b88364]">🌡️</span> Sensor exterior — sombra, ventilado
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[#b88364]">╔╗</span> Gabinete IP65 — protegido, accesible
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Paso 5 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#1b4235] text-white flex items-center justify-center text-sm font-bold">5</span>
                  <h4 className="font-serif text-xl text-[#1b4235]">
                    Prueba de agua
                  </h4>
                </div>
                <div className="ml-11 space-y-4 text-[#5c3d2e] leading-relaxed">
                  <p>
                    Antes de declarar tu estación lista para la intemperie, hay que verificar que realmente
                    sea impermeable. La prueba es simple pero reveladora: si entra agua ahora, mejor
                    descubrirlo con la electrónica apagada que durante una tormenta.
                  </p>

                  <div className="bg-[#edd3c5]/30 p-6 rounded-lg border border-[#b88364]/20">
                    <p className="font-medium text-[#1b4235] mb-2">🚫 Nunca uses manguera a presión</p>
                    <p className="text-sm text-[#5c3d2e]">
                      Una manguera puede meter agua a presión donde la lluvia nunca entraría.
                      IP65 resiste chorros <em>de baja presión</em>, no un hidrolavadora. Si usas manguera
                      para probar, podrías arruinar componentes que habrían sobrevivido a la lluvia real.
                      La prueba correcta es con una cubeta o regadera.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-[#1b4235]/10">
                    <p className="font-medium text-[#1b4235] mb-3">🪣 Procedimiento</p>
                    <ol className="text-sm space-y-3 text-[#5c3d2e] list-decimal list-inside">
                      <li>
                        <strong>Apaga y desconecta todo.</strong> Saca la Raspberry Pi y la placa perforada del gabinete. La prueba se hace con el gabinete <em>vacío</em>. Coloca una servilleta de papel dentro: cualquier fuga será obvia al instante.
                      </li>
                      <li>
                        <strong>Cierra el gabinete.</strong> Asegúrate de que la junta de silicona de la tapa esté limpia y bien asentada. Atornilla las cuatro esquinas en orden cruzado (como la tapa de un motor) para presión pareja.
                      </li>
                      <li>
                        <strong>Llena una cubeta con agua.</strong> No necesita ser agua a presión. Simplemente sumerge el gabinete cerrado en la cubeta por 10–15 segundos, o vierte agua sobre él con una jarra desde ~30 cm de altura simulando lluvia.
                      </li>
                      <li>
                        <strong>Abre y revisa.</strong> Seca el exterior con una toalla <em>antes</em> de abrir, para que no entre agua por descuido. Revisa la servilleta. Si está seca: ¡éxito! Si está húmeda: revisa cada prensaestopas, la junta de la tapa y cualquier perforación que hayas hecho.
                      </li>
                      <li>
                        <strong>Corrige las fugas.</strong> Aplica silicón sellador en las fisuras detectadas, deja secar según instrucciones del fabricante (usualmente 24 horas para cura total), y repite la prueba.
                      </li>
                    </ol>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-[#1b4235]/10">
                    <p className="font-medium text-[#1b4235] mb-2">✅ Checklist de impermeabilización</p>
                    <ul className="text-sm space-y-1 text-[#5c3d2e]">
                      <li>☐ Junta de silicona de la tapa: limpia, sin cortes, bien asentada.</li>
                      <li>☐ Prensasestopas: ajustados. La goma sella alrededor de cada cable.</li>
                      <li>☐ Conexiones soldadas: cubiertas con termocontraíble (adentro del gabinete).</li>
                      <li>☐ Conexiones externas: cubiertas con silicón sellador o cinta aislante líquida.</li>
                      <li>☐ Cables con lazo de goteo: el agua escurre hacia abajo, no hacia adentro.</li>
                      <li>☐ Orificios no utilizados: sellados con silicón o tapón ciego.</li>
                      <li>☐ Silica gel: fresco, bien adherido al interior del gabinete.</li>
                      <li>☐ Tornillos de la tapa: apretados en cruz, no deforman la junta.</li>
                    </ul>
                  </div>

                  <div className="bg-[#edd3c5]/30 p-6 rounded-lg border border-[#b88364]/20">
                    <p className="font-medium text-[#1b4235] mb-2">🎉 ¡Tu estación ya vive afuera!</p>
                    <p className="text-sm text-[#5c3d2e] leading-relaxed">
                      Una vez que pase la prueba de agua, reinstala la Raspberry Pi y la placa, conecta todo,
                      cierra el gabinete definitivamente y enciende. Tu estación está lista para Fase 5:
                      la instalación en campo y la configuración de monitoreo remoto. Has pasado de un
                      experimento de laboratorio a un instrumento meteorológico real. Tómate un momento
                      para apreciarlo. Respira. Lo construiste tú.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resumen visual de la estación terminada */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">Tu estación</p>
          <h2 className="font-serif text-4xl text-[#1b4235] tracking-[-0.02em] mb-10">
            Así se ve tu estación terminada
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: '🔩', title: 'Montaje sólido', text: 'Mástil de PVC a plomo, anclado 40 cm en tierra o con abrazaderas U a estructura firme. Aguanta vientos de hasta 60 km/h.' },
              { emoji: '💧', title: 'Impermeable', text: 'Gabinete IP65 con prensaestopas sellados, silica gel interna y lazos de goteo en todos los cables. Probado con cubeta.' },
              { emoji: '☀️', title: 'Autónoma', text: 'Panel solar orientado al sur a 34°, alimentando la Raspberry Pi todo el día. Batería para la noche y días nublados.' },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-lg border border-[#1b4235]/5 bg-[#faf7f5]">
                <p className="text-3xl mb-4">{item.emoji}</p>
                <h3 className="font-serif text-lg text-[#1b4235] mb-2">{item.title}</h3>
                <p className="text-sm text-[#5c3d2e] leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Navegación entre fases */}
      <section className="py-16 bg-[#1b4235] text-white">
        <div className="max-w-4xl mx-auto px-6 flex justify-between items-center">
          <Link
            href="/comunidad/fase-3-programacion"
            className="group flex items-center gap-4 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          >
            <span className="text-2xl group-hover:-translate-x-1 transition-transform">←</span>
            <div>
              <p className="text-xs text-[#b88364] tracking-wider uppercase">Anterior</p>
              <p className="text-lg font-serif">Fase 3: Programación</p>
            </div>
          </Link>
          <Link
            href="/comunidad/fase-5-instalacion"
            className="group flex items-center gap-4 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          >
            <div className="text-right">
              <p className="text-xs text-[#b88364] tracking-wider uppercase">Siguiente</p>
              <p className="text-lg font-serif">Fase 5: Instalación</p>
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
