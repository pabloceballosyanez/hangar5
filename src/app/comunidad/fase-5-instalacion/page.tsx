import Link from 'next/link';
import CursoNav from '../CursoNav';

export const metadata = {
  title: 'Fase 5: Instalación en Campo — Red Meteorológica Comunitaria',
  description: 'Despliega tu estación en el despegue, medio cerro y aterrizaje. Checklist de instalación, orientación solar, conectividad 4G y verificación de datos en tiempo real.',
};

export default function Fase5Page() {
  return (
    <main className="min-h-screen bg-ink">
      <CursoNav fase={5} />

      {/* Hero */}
      <section className="relative py-32 bg-ink text-snow overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/img/paisaje.jpg')] bg-cover bg-center" />
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <p className="text-brass tracking-[0.3em] uppercase text-sm mb-4">Fase 5 · 1 día por estación</p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.1] mb-6 tracking-[-0.02em]">
            Instalación<br /><span className="italic">en Campo</span>
          </h1>
          <p className="text-lg text-ash max-w-2xl">
            El momento de llevar las estaciones a sus ubicaciones definitivas. Subimos al despegue,
            medio cerro y aterrizaje para instalar, conectar y verificar que los datos lleguen
            al tablero en tiempo real. Es el día en que todo cobra sentido.
          </p>
        </div>
      </section>

      {/* Objetivos */}
      <section className="py-20 bg-ink">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-brass tracking-[0.3em] uppercase text-sm mb-4">Objetivos</p>
          <h2 className="font-serif text-4xl text-snow tracking-[-0.02em] mb-10">
            Lo que harás en esta fase
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Elegir la ubicación óptima para medir viento sin obstrucciones',
              'Realizar un levantamiento del sitio: GPS, orientación, obstáculos',
              'Instalar la estación de forma segura sobre mástil o estructura existente',
              'Conectar a WiFi o red 4G en ubicación remota',
              'Verificar que los datos aparezcan en vivo en el tablero de control',
              'Documentar la instalación con fotos desde los 4 puntos cardinales',
              'Registrar coordenadas GPS exactas de cada estación',
              'Anotar observaciones y posibles puntos de mantenimiento futuro',
            ].map((obj, i) => (
              <div key={i} className="flex gap-3 p-4 bg-ink-2 rounded-lg border border-ink/5">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brass/10 flex items-center justify-center text-xs text-brass font-bold">{i + 1}</span>
                <p className="text-sm text-ash leading-relaxed">{obj}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Materiales para esta fase */}
      <section className="py-20 bg-ink-2">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-brass tracking-[0.3em] uppercase text-sm mb-4">Materiales</p>
          <h2 className="font-serif text-4xl text-snow tracking-[-0.02em] mb-10">
            ¿Qué necesitas para esta fase?
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ink/10">
                  <th className="py-4 pr-8 text-xs tracking-[0.2em] uppercase text-brass font-normal">Cantidad</th>
                  <th className="py-4 pr-8 text-xs tracking-[0.2em] uppercase text-brass font-normal">Material</th>
                  <th className="py-4 text-right text-xs tracking-[0.2em] uppercase text-brass font-normal">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {[
                  ['1', 'Estación completamente ensamblada', 'Probada en taller, con panel y batería'],
                  ['1', 'Pala o posteadora', 'Para cavar hoyo del mástil'],
                  ['1–2 sacos', 'Mezcla de concreto rápido', 'Solo si la instalación es permanente'],
                  ['1', 'Brújula o GPS del teléfono', 'Para orientar panel solar al sur'],
                  ['1', 'Nivel de burbuja', 'Asegurar que el mástil quede vertical'],
                  ['1 set', 'Herramientas: llave ajustable, desarmador', 'Para ajustes finales en campo'],
                  ['1', 'Teléfono con datos móviles', 'Probar conectividad y verificar tablero'],
                  ['1', 'Libreta y pluma', 'Documentar coordenadas y observaciones'],
                  ['1', 'Cámara o teléfono', 'Fotos desde los 4 puntos cardinales'],
                  ['1 rollo', 'Cinta aislante o cinchos extra', 'Asegurar cables sueltos'],
                ].map(([cant, mat, nota]) => (
                  <tr key={mat} className="hover:bg-fog transition-colors">
                    <td className="py-4 pr-8 text-sm text-snow font-medium">{cant}</td>
                    <td className="py-4 pr-8 text-sm text-ash">{mat}</td>
                    <td className="py-4 text-right text-sm text-ash/60">{nota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Contenido del curso */}
      <section className="py-20 bg-ink">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-brass tracking-[0.3em] uppercase text-sm mb-4">Contenido</p>
          <h2 className="font-serif text-4xl text-snow tracking-[-0.02em] mb-16">
            Despliegue en campo
          </h2>

          {/* Principio general: ubicación del viento */}
          <div className="mb-20">
            <div className="bg-ink-2 p-8 rounded-lg border border-ink/5 mb-12">
              <h3 className="font-serif text-2xl text-snow mb-4">📐 Principio general: dónde medir el viento</h3>
              <div className="space-y-4 text-ash leading-relaxed">
                <p>
                  El viento es lo más importante para un piloto. Pero medirlo bien no es tan fácil
                  como poner el anemómetro en cualquier lado. Hay una regla de oro:
                </p>
                <div className="bg-snow/30 p-6 rounded-lg border border-brass/20">
                  <p className="font-medium text-snow text-lg mb-2">
                    Regla 10:1
                  </p>
                  <p className="text-sm text-ash">
                    El anemómetro debe estar al menos a <strong>10 veces la altura</strong> del obstáculo
                    más cercano. Si hay un árbol de 3 metros al lado, el anemómetro debe estar a
                    30 metros de distancia de ese árbol.
                  </p>
                </div>
                <p>
                  Esto se debe a que los obstáculos generan turbulencia y zonas de sombra de viento
                  que alteran las mediciones. En un sitio de vuelo como El Peñón, el despegue es
                  el punto más expuesto y por lo tanto el más crítico para medir correctamente.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-ink-2 p-5 rounded-lg border border-ink/5">
                    <p className="text-brass text-xs tracking-wider uppercase mb-2">Altura del anemómetro</p>
                    <p className="text-sm">Mínimo 2 metros sobre el suelo. Ideal: 3–5 metros. Nunca menos de 1.5 m.</p>
                  </div>
                  <div className="bg-ink-2 p-5 rounded-lg border border-ink/5">
                    <p className="text-brass text-xs tracking-wider uppercase mb-2">Distancia a obstáculos</p>
                    <p className="text-sm">10× la altura del obstáculo más cercano. Busca la zona más despejada.</p>
                  </div>
                  <div className="bg-ink-2 p-5 rounded-lg border border-ink/5">
                    <p className="text-brass text-xs tracking-wider uppercase mb-2">Exposición al viento</p>
                    <p className="text-sm">El anemómetro debe recibir viento de todas las direcciones sin bloqueos.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Paso 1: El Despegue */}
          <div className="mb-20">
            <h3 className="font-serif text-3xl text-snow mb-8">Estación 1: El Despegue (~2,800 m)</h3>
            
            <div className="space-y-12">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-ink text-snow flex items-center justify-center text-sm font-bold">1</span>
                  <h4 className="font-serif text-xl text-snow">La estación más importante</h4>
                </div>
                <div className="ml-11 space-y-4 text-ash leading-relaxed">
                  <p>
                    Esta es <strong>la estación crítica</strong>. Los pilotos necesitan saber cómo está el
                    viento en el despegue antes de subir. Una lectura incorrecta aquí puede llevar
                    a malas decisiones de vuelo. Por eso le dedicamos especial atención a la ubicación.
                  </p>
                  <div className="bg-snow/30 p-6 rounded-lg border border-brass/20">
                    <p className="font-medium text-snow mb-2">🔍 Antes de cavar: levantamiento del sitio</p>
                    <ul className="text-sm space-y-2 text-ash">
                      <li>• Camina toda la zona del despegue. Busca el punto más expuesto al viento predominante.</li>
                      <li>• Verifica con la brújula: ¿desde dónde sopla el viento la mayoría de los días? (En El Peñón suele ser SW).</li>
                      <li>• Aléjate al menos 10 metros de árboles, rocas grandes o estructuras.</li>
                      <li>• ¿Hay buena exposición solar durante todo el día? A 2,800 m suele haber menos vegetación, lo cual ayuda.</li>
                      <li>• Toma una foto panorámica del sitio. Márcala con los puntos cardinales.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-ink text-snow flex items-center justify-center text-sm font-bold">2</span>
                  <h4 className="font-serif text-xl text-snow">Conectividad: casi seguro 4G</h4>
                </div>
                <div className="ml-11 space-y-4 text-ash leading-relaxed">
                  <p>
                    El despegue rara vez tiene WiFi. La solución es un <strong>módem USB 4G con chip SIM</strong>
                    conectado directamente a la Raspberry Pi. Esto le da internet a la estación
                    sin depender de nadie.
                  </p>
                  <div className="bg-ink text-snow p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-brass mb-3"># Verifica la señal ANTES de fijar la estación</p>
                    <p className="text-ash">1. Inserta el chip SIM en el módem 4G USB.</p>
                    <p className="text-ash">2. Conecta el módem a la Raspberry Pi (por USB).</p>
                    <p className="text-ash">3. Enciende la estación.</p>
                    <p className="text-ash">4. Conéctate por SSH y verifica:</p>
                    <p className="text-snow mt-2">lsusb</p>
                    <p className="text-ash mt-1"># Deberías ver el módem Huawei o ZTE listado</p>
                    <p className="text-snow mt-2">ip a</p>
                    <p className="text-ash mt-1"># Busca una interfaz como wwan0 o usb0 con IP asignada</p>
                    <p className="text-snow mt-2">ping -c 3 8.8.8.8</p>
                    <p className="text-ash mt-1"># Si responde, ¡tenemos internet!</p>
                  </div>
                  <div className="bg-snow/30 p-6 rounded-lg border border-brass/20">
                    <p className="font-medium text-snow mb-2">⚠️ Importante: prueba de señal</p>
                    <p className="text-sm text-ash leading-relaxed">
                      Antes de fijar definitivamente la estación, camina con el módem conectado
                      por la zona. A veces moverte 5 metros mejora la señal de 1 barra a 4 barras.
                      Busca línea de vista hacia el valle (donde suelen estar las antenas celulares).
                      Si no hay señal en absoluto, explora ubicaciones alternativas o considera un
                      repetidor celular.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-ink text-snow flex items-center justify-center text-sm font-bold">3</span>
                  <h4 className="font-serif text-xl text-snow">Orientación del panel solar</h4>
                </div>
                <div className="ml-11 space-y-4 text-ash leading-relaxed">
                  <p>
                    En el hemisferio norte, el panel solar debe orientarse hacia el <strong>sur geográfico</strong>,
                    no hacia donde "parece que da el sol". Usa la brújula del teléfono.
                  </p>
                  <div className="bg-ink-2 p-6 rounded-lg border border-ink/10">
                    <p className="font-medium text-snow mb-3">🧭 Orientación correcta del panel</p>
                    <ul className="text-sm space-y-2 text-ash">
                      <li>• <strong>Dirección:</strong> Sur geográfico (180° en la brújula).</li>
                      <li>• <strong>Inclinación:</strong> Aproximadamente igual a la latitud del lugar (~19° para El Peñón).</li>
                      <li>• <strong>Sombras:</strong> Verifica que ningún árbol, poste o roca proyecte sombra sobre el panel entre 9 AM y 4 PM.</li>
                      <li>• <strong>Fijación:</strong> Aprieta bien las abrazaderas. El viento en el despegue puede ser fuerte y mover un panel mal asegurado.</li>
                    </ul>
                  </div>
                  <div className="bg-snow/30 p-6 rounded-lg border border-brass/20">
                    <p className="font-medium text-snow mb-2">💡 Tip de seguridad</p>
                    <p className="text-sm text-ash leading-relaxed">
                      En el despegue, el viento puede superar los 40 km/h en días de vuelo.
                      Asegura todo con doble cincho o abrazadera metálica. Un panel solar
                      volando es peligroso para pilotos y personas abajo. Revisa que no haya
                      filos ni puntas expuestas que puedan dañar una vela de parapente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Paso 2: Medio Cerro */}
          <div className="mb-20">
            <h3 className="font-serif text-3xl text-snow mb-8">Estación 2: Medio Cerro</h3>
            
            <div className="space-y-12">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-ink text-snow flex items-center justify-center text-sm font-bold">4</span>
                  <h4 className="font-serif text-xl text-snow">El eslabón intermedio</h4>
                </div>
                <div className="ml-11 space-y-4 text-ash leading-relaxed">
                  <p>
                    La estación de medio cerro captura el <strong>gradiente térmico</strong>: cómo cambia
                    la temperatura y el viento entre el despegue y el aterrizaje. Para un piloto
                    esto es información valiosa: si hace más calor abajo que arriba, hay térmicas;
                    si el viento cambia de dirección a media ladera, hay que ajustar la ruta.
                  </p>
                  <p>
                    Esta estación suele estar en una zona con <strong>vegetación más densa</strong>,
                    lo que crea desafíos particulares.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-ink text-snow flex items-center justify-center text-sm font-bold">5</span>
                  <h4 className="font-serif text-xl text-snow">Panel solar en sombra parcial</h4>
                </div>
                <div className="ml-11 space-y-4 text-ash leading-relaxed">
                  <p>
                    A diferencia del despegue, medio cerro puede tener sombra de árboles durante
                    parte del día. Esto es un problema serio porque el panel necesita al menos
                    <strong> 4 horas de sol directo</strong> para mantener la batería cargada.
                  </p>
                  <div className="bg-ink-2 p-6 rounded-lg border border-ink/10">
                    <p className="font-medium text-snow mb-3">🌳 Estrategia para sombra parcial</p>
                    <ul className="text-sm space-y-2 text-ash">
                      <li>• <strong>Observa el sitio durante un día completo</strong> antes de decidir. Toma nota de cuándo hay sombra.</li>
                      <li>• Si hay un claro natural, instala ahí. Una zona de 2×2 metros sin sombra de 10 AM a 3 PM es suficiente.</li>
                      <li>• <strong>Eleva el panel</strong>: si la sombra viene de arbustos bajos, subir el mástil 1 metro más puede resolverlo.</li>
                      <li>• Si es inevitable algo de sombra, instala un <strong>panel de mayor wattaje</strong> (10W en vez de 5W).</li>
                      <li>• Poda solo lo estrictamente necesario y con permiso. No se trata de deforestar.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-ink text-snow flex items-center justify-center text-sm font-bold">6</span>
                  <h4 className="font-serif text-xl text-snow">Conectividad: WiFi por relevo</h4>
                </div>
                <div className="ml-11 space-y-4 text-ash leading-relaxed">
                  <p>
                    Si hay línea de vista entre medio cerro y el despegue (o el Hangar en el aterrizaje),
                    puedes usar un <strong>enlace WiFi punto a punto</strong> en vez de un módem 4G.
                    Dos antenas direccionales Ubiquiti NanoStation (o similares) pueden cubrir varios
                    kilómetros con línea de vista despejada.
                  </p>
                  <div className="bg-snow/30 p-6 rounded-lg border border-brass/20">
                    <p className="font-medium text-snow mb-2">🔗 Opciones de conectividad para medio cerro</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-brass/20">
                          <th className="py-2 pr-4 text-left text-snow">Opción</th>
                          <th className="py-2 pr-4 text-left text-snow">Ventaja</th>
                          <th className="py-2 text-left text-snow">Costo extra</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brass/10">
                        <tr>
                          <td className="py-2 pr-4 font-medium">Módem 4G propio</td>
                          <td className="py-2 pr-4">Independiente, igual que el despegue</td>
                          <td className="py-2">~$500 + plan datos</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-medium">WiFi de largo alcance</td>
                          <td className="py-2 pr-4">Sin costo mensual de datos</td>
                          <td className="py-2">~$1,500 en antenas</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-medium">Repetidor desde el Hangar</td>
                          <td className="py-2 pr-4">Aprovecha el WiFi existente</td>
                          <td className="py-2">~$800 en repetidor</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    La decisión depende de la distancia, la línea de vista y el presupuesto.
                    Si hay dudas, el módem 4G es la opción más sencilla y confiable.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Paso 3: El Aterrizaje / Hangar 5 */}
          <div className="mb-20">
            <h3 className="font-serif text-3xl text-snow mb-8">Estación 3: El Aterrizaje — Hangar 5</h3>
            
            <div className="space-y-12">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-ink text-snow flex items-center justify-center text-sm font-bold">7</span>
                  <h4 className="font-serif text-xl text-snow">La estación de referencia</h4>
                </div>
                <div className="ml-11 space-y-4 text-ash leading-relaxed">
                  <p>
                    Esta es la estación más fácil de instalar y mantener. El aterrizaje suele tener
                    <strong> WiFi desde el Hangar</strong>, acceso fácil, y es el punto de referencia
                    para las condiciones de aterrizaje. Un piloto que está por aterrizar quiere saber:
                    ¿hay viento de cola? ¿De costado? ¿Está entrando alguna ráfaga?
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-ink text-snow flex items-center justify-center text-sm font-bold">8</span>
                  <h4 className="font-serif text-xl text-snow">Montaje en estructura existente</h4>
                </div>
                <div className="ml-11 space-y-4 text-ash leading-relaxed">
                  <p>
                    A diferencia del despegue, aquí puedes aprovechar la estructura del Hangar para
                    montar la estación. Esto ahorra trabajo de excavación y concreto.
                  </p>
                  <div className="bg-ink-2 p-6 rounded-lg border border-ink/10">
                    <p className="font-medium text-snow mb-3">🏗️ Opciones de montaje en el Hangar</p>
                    <ul className="text-sm space-y-2 text-ash">
                      <li>• <strong>Mástil en pared exterior:</strong> Fija un tubo de 2–3 metros a la pared con abrazaderas. El anemómetro en la punta.</li>
                      <li>• <strong>Poste independiente:</strong> En una esquina del terreno, lejos de árboles y del edificio mismo.</li>
                      <li>• <strong>Sobre el techo:</strong> Solo si el techo es plano o tiene una estructura segura. Evita que el edificio bloquee el viento.</li>
                    </ul>
                  </div>
                  <div className="bg-snow/30 p-6 rounded-lg border border-brass/20">
                    <p className="font-medium text-snow mb-2">⚠️ Cuidado con el edificio</p>
                    <p className="text-sm text-ash leading-relaxed">
                      Si montas la estación muy cerca del Hangar, el edificio mismo se convierte
                      en un obstáculo. La regla 10:1 aplica también aquí: si el Hangar mide 4 metros
                      de alto, el anemómetro debería estar al menos a 40 metros de distancia.
                      Si no es posible, colócalo al menos en la esquina más expuesta al viento
                      predominante y súbelo lo más alto posible.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-ink text-snow flex items-center justify-center text-sm font-bold">9</span>
                  <h4 className="font-serif text-xl text-snow">Conectividad: la más sencilla</h4>
                </div>
                <div className="ml-11 space-y-4 text-ash leading-relaxed">
                  <p>
                    Si el Hangar tiene WiFi, esta estación se conecta directamente. Es la situación ideal:
                    cero costo de datos, cero configuración extra. Solo asegúrate de que la señal WiFi
                    llegue bien al punto de montaje.
                  </p>
                  <div className="bg-ink text-snow p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                    <p className="text-brass mb-3"># Verifica la señal WiFi en el punto de montaje</p>
                    <p className="text-ash"># Conéctate por SSH a la estación:</p>
                    <p className="text-snow">iwconfig wlan0</p>
                    <p className="text-ash mt-1"># Revisa Link Quality. Debe ser al menos 50/70.</p>
                    <p className="text-snow mt-2">ping -c 10 192.168.1.1</p>
                    <p className="text-ash mt-1"># Prueba de latencia al router. Sin paquetes perdidos.</p>
                    <p className="text-snow mt-2">curl -s https://hangar5.onrender.com/api/health</p>
                    <p className="text-ash mt-1"># Verifica que la API del tablero sea accesible.</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-ink text-snow flex items-center justify-center text-sm font-bold">10</span>
                  <h4 className="font-serif text-xl text-snow">La temperatura como referencia de altitud</h4>
                </div>
                <div className="ml-11 space-y-4 text-ash leading-relaxed">
                  <p>
                    Con tres estaciones a diferentes altitudes, los datos de temperatura permiten
                    <strong> calcular el gradiente adiabático real</strong> de ese día. Esto ayuda a
                    predecir la fuerza de las térmicas: mientras mayor sea la diferencia de temperatura
                    entre el aterrizaje y el despegue, más fuertes serán las ascendentes.
                  </p>
                  <div className="bg-ink-2 p-6 rounded-lg border border-ink/10">
                    <p className="font-medium text-snow mb-3">📊 Interpretación del gradiente</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-ink/10">
                          <th className="py-2 pr-4 text-left text-brass">Estación</th>
                          <th className="py-2 pr-4 text-left text-brass">Altitud aprox.</th>
                          <th className="py-2 text-left text-brass">Temperatura típica</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/5">
                        <tr><td className="py-2 pr-4 font-medium">Despegue</td><td className="py-2 pr-4">~2,800 m</td><td className="py-2">~15 °C</td></tr>
                        <tr><td className="py-2 pr-4 font-medium">Medio cerro</td><td className="py-2 pr-4">~2,400 m</td><td className="py-2">~18 °C</td></tr>
                        <tr><td className="py-2 pr-4 font-medium">Aterrizaje</td><td className="py-2 pr-4">~1,800 m</td><td className="py-2">~22 °C</td></tr>
                      </tbody>
                    </table>
                    <p className="text-sm text-ash mt-4">
                      Si la diferencia despegue-aterrizaje es mayor a 7 °C (en vez de los ~6.5 °C esperados
                      por altitud), el aire está más inestable de lo normal. Las térmicas serán más
                      fuertes. Si la diferencia es menor, la atmósfera está más estable: día más suave.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Paso 4: Verificación final */}
          <div>
            <h3 className="font-serif text-3xl text-snow mb-8">Verificación final de cada estación</h3>
            
            <div className="space-y-12">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-ink text-snow flex items-center justify-center text-sm font-bold">11</span>
                  <h4 className="font-serif text-xl text-snow">Checklist de instalación</h4>
                </div>
                <div className="ml-11 space-y-4 text-ash leading-relaxed">
                  <p>
                    Antes de dar por terminada la instalación, recorre esta lista para <strong>cada estación</strong>.
                    No te saltes ningún punto. Un problema detectado ahora se arregla en 5 minutos; uno
                    no detectado implica volver a subir otro día.
                  </p>

                  <div className="bg-ink text-snow p-8 rounded-lg">
                    <p className="font-serif text-2xl mb-6">📋 Checklist de Instalación en Campo</p>
                    <div className="space-y-4">
                      {[
                        { label: 'LED de encendido', desc: '¿El LED verde de la Raspberry Pi está encendido? Significa que la estación recibe energía del panel o batería.' },
                        { label: 'WiFi o 4G conectado', desc: '¿Hace ping a internet? Abre SSH y ejecuta ping -c 3 8.8.8.8. Debe responder sin pérdida de paquetes.' },
                        { label: 'Datos en el tablero', desc: 'Abre el dashboard en tu celular. ¿Aparece la estación? ¿Los valores se actualizan? Espera al menos 3 lecturas (3 minutos).' },
                        { label: 'Anemómetro gira libre', desc: 'Gira las cazoletas con la mano. ¿Se mueven sin fricción? ¿La veleta apunta en la dirección correcta? Compara con la brújula.' },
                        { label: 'Cables seguros', desc: 'Revisa cada conexión: USB del módem, cable del panel solar al controlador, jumpers del anemómetro a la Pi. Nada debe estar suelto o en tensión.' },
                        { label: 'Panel solar firme', desc: '¿Las abrazaderas están apretadas? ¿El panel no se mueve con el viento? ¿Está orientado al sur?' },
                        { label: 'Gabinete sellado', desc: '¿Las prensaestopas están apretadas? ¿La tapa cierra bien? Pasa el dedo por las juntas: no debe haber holgura.' },
                        { label: 'Fotos desde 4 direcciones', desc: 'Toma foto desde el norte, sur, este y oeste. Sirven para documentar y para futuras visitas de mantenimiento.' },
                        { label: 'Coordenadas GPS', desc: 'Abre Google Maps o cualquier app de GPS. Toma captura de pantalla con las coordenadas exactas. Anótalas en la libreta.' },
                        { label: 'Observaciones', desc: 'Anota cualquier cosa que notes: "el árbol del este crecerá y podría dar sombra en 2 años", "se escuchan coyotes cerca, ¿morderán cables?". Todo sirve.' },
                      ].map((item, i) => (
                        <label key={i} className="flex items-start gap-4 p-4 bg-snow/5 rounded-lg hover:bg-snow/10 transition-colors cursor-pointer">
                          <input type="checkbox" className="mt-1 w-5 h-5 rounded border-snow/20/30 bg-transparent accent-brass" />
                          <div>
                            <p className="font-medium text-ink">{item.label}</p>
                            <p className="text-sm text-smoke mt-1">{item.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-snow/30 p-6 rounded-lg border border-brass/20">
                    <p className="font-medium text-ink mb-2">📸 Documentación fotográfica</p>
                    <p className="text-sm text-ash leading-relaxed">
                      Las fotos no son solo para el recuerdo. Son la herramienta más útil para el
                      mantenimiento futuro. Cuando alguien suba en 6 meses a revisar, las fotos le
                      dirán exactamente cómo estaba instalado todo. Toma fotos de:
                    </p>
                    <ul className="text-sm space-y-1 mt-3 text-ash">
                      <li>• La estación completa desde cada punto cardinal (4 fotos)</li>
                      <li>• Un primer plano del panel solar y su orientación</li>
                      <li>• El gabinete abierto mostrando las conexiones internas</li>
                      <li>• El anemómetro desde abajo (para ver si está nivelado)</li>
                      <li>• Una panorámica del entorno (para ver obstáculos)</li>
                      <li>• La pantalla del celular mostrando los datos en vivo en el tablero</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-ink text-ink flex items-center justify-center text-sm font-bold">12</span>
                  <h4 className="font-serif text-xl text-ink">Registro de coordenadas y datos de instalación</h4>
                </div>
                <div className="ml-11 space-y-4 text-ash leading-relaxed">
                  <p>
                    Crea una ficha para cada estación. Esta información se guarda en el repositorio del proyecto
                    y sirve como referencia permanente.
                  </p>
                  <div className="bg-ink-2 p-6 rounded-lg border border-ink/10 font-mono text-sm">
                    <p className="text-brass mb-4"># Ficha de instalación — Ejemplo</p>
                    <div className="space-y-2 text-ash">
                      <p><strong>Nombre:</strong> Estación Despegue — Peñón-01</p>
                      <p><strong>Fecha de instalación:</strong> 15 de junio de 2026</p>
                      <p><strong>Instalado por:</strong> Equipo 1 (Ana, Luis, Carlos, María)</p>
                      <p><strong>Coordenadas GPS:</strong> 19.0634° N, 99.9523° W</p>
                      <p><strong>Altitud:</strong> 2,815 m snm</p>
                      <p><strong>Altura del mástil:</strong> 3.2 metros</p>
                      <p><strong>Orientación panel:</strong> 178° (sur), inclinación 20°</p>
                      <p><strong>Conectividad:</strong> Módem 4G Huawei E3372 — Chip Telcel</p>
                      <p><strong>Señal celular:</strong> 3 de 5 barras (aceptable)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resumen: las tres estaciones */}
      <section className="py-20 bg-ink-2">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-brass tracking-[0.3em] uppercase text-sm mb-4">Resumen</p>
          <h2 className="font-serif text-4xl text-ink tracking-[-0.02em] mb-12">
            Las tres estaciones en contexto
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-fog p-8 rounded-lg border border-ink/5">
              <div className="w-12 h-12 rounded-full bg-ink text-ink flex items-center justify-center text-lg font-bold mb-4">1</div>
              <h3 className="font-serif text-xl text-ink mb-3">El Despegue</h3>
              <ul className="text-sm space-y-2 text-ash leading-relaxed">
                <li>• ~2,800 m · Más crítica</li>
                <li>• Viento sin obstrucciones</li>
                <li>• Panel solar al sur</li>
                <li>• Probablemente 4G</li>
                <li>• Fijación reforzada</li>
              </ul>
            </div>
            <div className="bg-fog p-8 rounded-lg border border-ink/5">
              <div className="w-12 h-12 rounded-full bg-brass text-ink flex items-center justify-center text-lg font-bold mb-4">2</div>
              <h3 className="font-serif text-xl text-ink mb-3">Medio Cerro</h3>
              <ul className="text-sm space-y-2 text-ash leading-relaxed">
                <li>• ~2,400 m · Gradiente térmico</li>
                <li>• Posible sombra parcial</li>
                <li>• Panel elevado o mayor W</li>
                <li>• 4G o WiFi largo alcance</li>
                <li>• Cambios de viento</li>
              </ul>
            </div>
            <div className="bg-fog p-8 rounded-lg border border-ink/5">
              <div className="w-12 h-12 rounded-full bg-brass text-ink flex items-center justify-center text-lg font-bold mb-4">3</div>
              <h3 className="font-serif text-xl text-ink mb-3">El Aterrizaje</h3>
              <ul className="text-sm space-y-2 text-ash leading-relaxed">
                <li>• ~1,800 m · Referencia LZ</li>
                <li>• WiFi del Hangar</li>
                <li>• Montaje en estructura</li>
                <li>• Más fácil mantenimiento</li>
                <li>• Calibración de altitud</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Navegación entre fases */}
      <section className="py-16 bg-ink text-ink">
        <div className="max-w-4xl mx-auto px-6 flex justify-between items-center">
          <Link
            href="/comunidad/fase-4-impermeabilizacion"
            className="group flex items-center gap-4 px-8 py-4 bg-snow/10 hover:bg-ink-2/20 rounded-lg transition-all"
          >
            <span className="text-2xl group-hover:-translate-x-1 transition-transform">←</span>
            <div>
              <p className="text-xs text-brass tracking-wider uppercase">Anterior</p>
              <p className="text-lg font-serif">Fase 4: Montaje</p>
            </div>
          </Link>
          <Link
            href="/comunidad/fase-6-monitoreo"
            className="group flex items-center gap-4 px-8 py-4 bg-snow/10 hover:bg-ink-2/20 rounded-lg transition-all"
          >
            <div className="text-right">
              <p className="text-xs text-brass tracking-wider uppercase">Siguiente</p>
              <p className="text-lg font-serif">Fase 6: Monitoreo</p>
            </div>
            <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </section>

      <footer className="bg-ink text-smoke py-12 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs tracking-[0.3em] uppercase mb-2">Hangar 5 · Comunidad</p>
          <p className="text-xs">
            <Link href="/comunidad" className="hover:text-ash transition-colors">Curso completo</Link>
            {' · '}Curso gratuito y abierto · © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </main>
  );
}
