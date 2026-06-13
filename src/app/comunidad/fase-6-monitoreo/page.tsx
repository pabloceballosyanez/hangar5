import Link from 'next/link';
import CursoNav from '../CursoNav';

export const metadata = {
  title: 'Fase 6: Monitoreo y Mejora Continua — Red Meteorológica Comunitaria',
  description:
    'Aprende a mantener tu estación meteorológica, diagnosticar problemas y mejorar continuamente la red comunitaria.',
};

export default function Fase6Page() {
  return (
    <main className="min-h-screen bg-[#faf7f5]">
      <CursoNav fase={6} />

      {/* Hero */}
      <section className="relative py-32 bg-[#1b4235] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/img/paisaje.jpg')] bg-cover bg-center" />
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">
            Fase 6 · Permanente
          </p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.1] mb-6 tracking-[-0.02em]">
            Monitoreo y<br />
            <span className="italic">Mejora Continua</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            La red meteorológica ya está funcionando. Ahora empieza el trabajo más
            importante: mantenerla viva, útil y en evolución. Esta fase no termina
            nunca — es el latido de la comunidad que cuida sus estaciones.
          </p>
        </div>
      </section>

      {/* Objetivos */}
      <section className="py-20 bg-[#faf7f5]">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">
            Objetivos
          </p>
          <h2 className="font-serif text-4xl text-[#1b4235] tracking-[-0.02em] mb-10">
            Lo que lograrás en esta fase
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Establecer una rotación de mantenimiento entre los miembros del equipo',
              'Limpiar los sensores periódicamente para mantener la precisión de los datos',
              'Monitorear la calidad de los datos y detectar anomalías a tiempo',
              'Responder a la retroalimentación de los pilotos',
              'Agregar nuevas estaciones a la red',
              'Mejorar el software del dashboard con nuevas funcionalidades',
              'Abrir los datos a la comunidad de parapente y meteorología',
              'Celebrar los logros y mantener viva la motivación del equipo',
            ].map((obj, i) => (
              <div
                key={i}
                className="flex gap-3 p-4 bg-white rounded-lg border border-[#1b4235]/5"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold">
                  {i + 1}
                </span>
                <p className="text-sm text-[#5c3d2e] leading-relaxed">{obj}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calendario de mantenimiento */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">
            Mantenimiento
          </p>
          <h2 className="font-serif text-4xl text-[#1b4235] tracking-[-0.02em] mb-4">
            Calendario de mantenimiento
          </h2>
          <p className="text-[#5c3d2e] mb-12 leading-relaxed max-w-2xl">
            La consistencia es la clave. Un chequeo breve y frecuente evita horas de
            reparación más adelante. Aquí tienes la rutina recomendada para cada
            estación.
          </p>

          <div className="space-y-6">
            {/* Semanal */}
            <div className="bg-[#faf7f5] rounded-lg border border-[#1b4235]/5 overflow-hidden">
              <div className="bg-[#1b4235] text-white px-6 py-4 flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="font-serif text-lg">Semanal</p>
                  <p className="text-xs text-white/50">
                    ~5 minutos por estación · Remoto
                  </p>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                    1
                  </span>
                  <p className="text-sm text-[#5c3d2e]">
                    Revisa el dashboard: ¿las tres estaciones están enviando datos?
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                    2
                  </span>
                  <p className="text-sm text-[#5c3d2e]">
                    Verifica el voltaje de batería de cada estación en el dashboard.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                    3
                  </span>
                  <p className="text-sm text-[#5c3d2e]">
                    Si alguna estación lleva más de 1 hora sin transmitir, planifica
                    una visita.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                    4
                  </span>
                  <p className="text-sm text-[#5c3d2e]">
                    Anota cualquier anomalía en la bitácora compartida (un Google Doc
                    o canal de WhatsApp del equipo).
                  </p>
                </div>
              </div>
            </div>

            {/* Mensual */}
            <div className="bg-[#faf7f5] rounded-lg border border-[#1b4235]/5 overflow-hidden">
              <div className="bg-[#1b4235] text-white px-6 py-4 flex items-center gap-3">
                <span className="text-2xl">🔧</span>
                <div>
                  <p className="font-serif text-lg">Mensual</p>
                  <p className="text-xs text-white/50">
                    ~30 minutos por estación · Visita física
                  </p>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                    1
                  </span>
                  <p className="text-sm text-[#5c3d2e]">
                    Inspecciona el panel solar: limpia con un paño húmedo, revisa que
                    no tenga excremento de aves ni polvo acumulado.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                    2
                  </span>
                  <p className="text-sm text-[#5c3d2e]">
                    Revisa el anemómetro: gíralo con la mano, escucha si hay ruido en
                    los rodamientos. Si chirría o se atora, necesita limpieza o
                    reemplazo.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                    3
                  </span>
                  <p className="text-sm text-[#5c3d2e]">
                    Inspecciona todos los cables: busca daños por sol, roedores o
                    pájaros. El sol reseca el plástico; los animales muerden.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                    4
                  </span>
                  <p className="text-sm text-[#5c3d2e]">
                    Abre la caja estanca: revisa que no haya entrado agua ni
                    condensación. Si hay humedad, el silica gel se saturó — cámbialo.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                    5
                  </span>
                  <p className="text-sm text-[#5c3d2e]">
                    Cambia el silica gel si está saturado (se nota porque los
                    cristales cambiaron de color o ya no son efectivos).
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                    6
                  </span>
                  <p className="text-sm text-[#5c3d2e]">
                    Verifica que los datos coincidan con lo esperado. Si tienes un
                    anemómetro de mano, compara las lecturas.
                  </p>
                </div>
              </div>
            </div>

            {/* Trimestral */}
            <div className="bg-[#faf7f5] rounded-lg border border-[#1b4235]/5 overflow-hidden">
              <div className="bg-[#1b4235] text-white px-6 py-4 flex items-center gap-3">
                <span className="text-2xl">⚙️</span>
                <div>
                  <p className="font-serif text-lg">Trimestral</p>
                  <p className="text-xs text-white/50">
                    ~1 hora por estación · Remoto + físico
                  </p>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                    1
                  </span>
                  <p className="text-sm text-[#5c3d2e]">
                    Reinicio completo del sistema. Desconecta y vuelve a conectar la
                    alimentación.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                    2
                  </span>
                  <p className="text-sm text-[#5c3d2e]">
                    Actualiza el sistema operativo de la Raspberry Pi.
                  </p>
                </div>
                <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto ml-8">
                  <p className="text-[#b88364] mb-3">
                    # Conectado por SSH a la estación
                  </p>
                  <p className="text-white">sudo apt update && sudo apt upgrade -y</p>
                  <p className="text-white/70 mt-2">
                    # Esto actualiza todos los paquetes del sistema.
                  </p>
                  <p className="text-white/70">
                    # Puede tardar varios minutos. No interrumpas el proceso.
                  </p>
                  <p className="text-white mt-3">sudo reboot</p>
                </div>
                <div className="flex gap-3 items-start mt-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                    3
                  </span>
                  <p className="text-sm text-[#5c3d2e]">
                    Revisa los scripts de Python: ¿hay algo que se pueda mejorar?
                    ¿Algún sensor nuevo que quieras agregar? Aprovecha para
                    documentar los cambios.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                    4
                  </span>
                  <p className="text-sm text-[#5c3d2e]">
                    Verifica la salud de la tarjeta microSD.
                  </p>
                </div>
                <div className="bg-[#1b4235] text-white p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto ml-8">
                  <p className="text-[#b88364] mb-3">
                    # Forzar revisión del sistema de archivos
                  </p>
                  <p className="text-white">sudo touch /forcefsck && sudo reboot</p>
                  <p className="text-white/70 mt-2">
                    # Esto programa una revisión del sistema de archivos
                  </p>
                  <p className="text-white/70">
                    # en el próximo arranque. Ayuda a detectar corrupción.
                  </p>
                </div>
                <div className="flex gap-3 items-start mt-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                    5
                  </span>
                  <p className="text-sm text-[#5c3d2e]">
                    Haz una copia de seguridad de los archivos de configuración y
                    scripts. Guárdalos en una USB o en la nube.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                    6
                  </span>
                  <p className="text-sm text-[#5c3d2e]">
                    Revisa los archivos de log en busca de anomalías: reinicios
                    inesperados, errores de sensor, caídas de conexión.
                  </p>
                </div>
              </div>
            </div>

            {/* Anual */}
            <div className="bg-[#faf7f5] rounded-lg border border-[#1b4235]/5 overflow-hidden">
              <div className="bg-[#1b4235] text-white px-6 py-4 flex items-center gap-3">
                <span className="text-2xl">🔄</span>
                <div>
                  <p className="font-serif text-lg">Anual</p>
                  <p className="text-xs text-white/50">
                    ~2 horas por estación · Mantenimiento mayor
                  </p>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                    1
                  </span>
                  <p className="text-sm text-[#5c3d2e]">
                    <strong>Reemplaza la batería Li-Ion.</strong> Las baterías se
                    degradan ~20% por año en calor exterior. Una batería nueva asegura
                    otro año de operación confiable.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                    2
                  </span>
                  <p className="text-sm text-[#5c3d2e]">
                    <strong>Reemplaza la tarjeta microSD.</strong> Es preventivo — las
                    microSD se desgastan con las escrituras continuas de datos. Clona
                    la tarjeta anterior para no perder la configuración.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                    3
                  </span>
                  <p className="text-sm text-[#5c3d2e]">
                    <strong>Limpieza profunda de todos los sensores.</strong> Desmonta,
                    limpia con alcohol isopropílico, revisa conexiones y vuelve a
                    montar con cuidado.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                    4
                  </span>
                  <p className="text-sm text-[#5c3d2e]">
                    <strong>Reunión comunitaria anual:</strong> Revisa el año de datos
                    recolectados, discute patrones interesantes y planea expansiones.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                    5
                  </span>
                  <p className="text-sm text-[#5c3d2e]">
                    Actualiza la documentación con lo aprendido durante el año. ¿Algo
                    cambió en el procedimiento? ¿Alguna lección nueva?
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mejora continua */}
      <section className="py-20 bg-[#faf7f5]">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">
            Evolución
          </p>
          <h2 className="font-serif text-4xl text-[#1b4235] tracking-[-0.02em] mb-4">
            Mejora continua
          </h2>
          <p className="text-[#5c3d2e] mb-12 leading-relaxed max-w-2xl">
            Una estación que no mejora se vuelve obsoleta. La red meteorológica es un
            organismo vivo: escucha, evoluciona y crece con las necesidades de la
            comunidad.
          </p>

          <div className="space-y-16">
            {/* Paso 1 */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#b88364] text-white flex items-center justify-center text-lg font-bold">
                  1
                </span>
                <h3 className="font-serif text-2xl text-[#1b4235]">
                  Feedback de pilotos
                </h3>
              </div>
              <div className="ml-14 space-y-4 text-[#5c3d2e] leading-relaxed">
                <p>
                  Los pilotos de parapente son los usuarios principales de la red.
                  Pregúntales directamente qué datos usan más y qué les ayudaría a
                  tomar mejores decisiones de vuelo.
                </p>
                <div className="bg-white p-6 rounded-lg border border-[#1b4235]/10">
                  <p className="font-medium text-[#1b4235] mb-3">
                    📋 Preguntas para un formulario de feedback
                  </p>
                  <ul className="text-sm space-y-2">
                    <li>
                      • ¿Qué dato consultas más seguido en el dashboard?
                    </li>
                    <li>
                      • ¿Hay algo que te gustaría ver y no está disponible?
                    </li>
                    <li>
                      • ¿En qué momento del día consultas los datos?
                    </li>
                    <li>
                      • ¿Te serviría recibir una alerta cuando el viento esté bueno
                      para volar?
                    </li>
                    <li>
                      • ¿Qué otra ubicación te gustaría que tuviera una estación?
                    </li>
                    <li>
                      • ¿Has notado que algún dato no coincida con la realidad?
                    </li>
                  </ul>
                </div>
                <div className="bg-[#edd3c5]/30 p-6 rounded-lg border border-[#b88364]/20">
                  <p className="font-medium text-[#1b4235] mb-2">
                    💡 Tip comunitario
                  </p>
                  <p className="text-sm text-[#5c3d2e] leading-relaxed">
                    Crea un formulario de Google Forms sencillo y comparte el enlace
                    en el grupo de WhatsApp de pilotos. Revisa las respuestas cada mes
                    en la reunión de equipo y prioriza las mejoras más pedidas.
                  </p>
                </div>
              </div>
            </div>

            {/* Paso 2 */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#b88364] text-white flex items-center justify-center text-lg font-bold">
                  2
                </span>
                <h3 className="font-serif text-2xl text-[#1b4235]">
                  Agregar más estaciones
                </h3>
              </div>
              <div className="ml-14 space-y-4 text-[#5c3d2e] leading-relaxed">
                <p>
                  Una red de tres estaciones es un gran comienzo, pero más estaciones
                  significan mejor cobertura y datos más ricos. El proceso es
                  replicable: ya tienes la receta.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-lg border border-[#1b4235]/5">
                    <p className="text-[#b88364] text-xs tracking-wider uppercase mb-2">
                      Identificar nuevos sitios
                    </p>
                    <p className="text-sm">
                      Busca sitios de despegue o aterrizaje que no tengan cobertura.
                      Prioriza lugares donde los pilotos vuelan con frecuencia.
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-[#1b4235]/5">
                    <p className="text-[#b88364] text-xs tracking-wider uppercase mb-2">
                      Capacitar nuevos estudiantes
                    </p>
                    <p className="text-sm">
                      Los que ya pasaron por el curso son los mejores instructores.
                      Que cada generación enseñe a la siguiente.
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-[#1b4235]/5">
                    <p className="text-[#b88364] text-xs tracking-wider uppercase mb-2">
                      Replicar el proceso
                    </p>
                    <p className="text-sm">
                      Ya tienes listas de materiales, scripts probados y un
                      procedimiento documentado. Cada nueva estación es más fácil que
                      la anterior.
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-[#1b4235]/5">
                    <p className="text-[#b88364] text-xs tracking-wider uppercase mb-2">
                      Buscar financiamiento
                    </p>
                    <p className="text-sm">
                      Una vez que la red demuestre su valor, busca apoyo de clubes de
                      vuelo, patrocinadores locales o fondos comunitarios para nuevas
                      estaciones.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Paso 3 */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#b88364] text-white flex items-center justify-center text-lg font-bold">
                  3
                </span>
                <h3 className="font-serif text-2xl text-[#1b4235]">
                  Mejoras de software
                </h3>
              </div>
              <div className="ml-14 space-y-4 text-[#5c3d2e] leading-relaxed">
                <p>
                  El software del dashboard es una plataforma viva. Aquí tienes ideas
                  para mejorarlo con el tiempo:
                </p>
                <div className="bg-white p-6 rounded-lg border border-[#1b4235]/5 space-y-3">
                  <div className="flex gap-3 items-start">
                    <span className="flex-shrink-0 text-[#b88364] text-sm mt-0.5">
                      📊
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#1b4235]">
                        Mejor UI del dashboard
                      </p>
                      <p className="text-sm text-[#5c3d2e]">
                        Gráficas interactivas por día/semana/mes, comparación entre
                        estaciones, modo oscuro para consulta nocturna.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="flex-shrink-0 text-[#b88364] text-sm mt-0.5">
                      📱
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#1b4235]">
                        Alertas meteorológicas por WhatsApp
                      </p>
                      <p className="text-sm text-[#5c3d2e]">
                        Cuando el viento esté en el rango ideal para volar (por
                        ejemplo, 15–25 km/h del ESE), envía un mensaje automático al
                        grupo de pilotos.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="flex-shrink-0 text-[#b88364] text-sm mt-0.5">
                      📈
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#1b4235]">
                        Tendencias históricas
                      </p>
                      <p className="text-sm text-[#5c3d2e]">
                        Visualiza patrones estacionales. ¿En qué meses hay mejores
                        condiciones para volar? ¿A qué hora del día el viento es más
                        favorable?
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="flex-shrink-0 text-[#b88364] text-sm mt-0.5">
                      🤖
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#1b4235]">
                        Predicciones simples
                      </p>
                      <p className="text-sm text-[#5c3d2e]">
                        Usa los datos históricos para predecir condiciones. Si la
                        presión está subiendo rápido, probablemente mañana será un
                        buen día para volar.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="flex-shrink-0 text-[#b88364] text-sm mt-0.5">
                      🧪
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#1b4235]">
                        Detección automática de anomalías
                      </p>
                      <p className="text-sm text-[#5c3d2e]">
                        El dashboard te avisa si una estación deja de transmitir, si
                        un sensor da lecturas fuera de rango o si la batería está
                        baja.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Paso 4 */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#b88364] text-white flex items-center justify-center text-lg font-bold">
                  4
                </span>
                <h3 className="font-serif text-2xl text-[#1b4235]">
                  Compartir los datos
                </h3>
              </div>
              <div className="ml-14 space-y-4 text-[#5c3d2e] leading-relaxed">
                <p>
                  Los datos meteorológicos son más valiosos cuando se comparten. Tu
                  red comunitaria puede contribuir al ecosistema global de información
                  climática.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-[#1b4235] text-white p-6 rounded-lg">
                    <p className="text-[#b88364] text-xs tracking-wider uppercase mb-3">
                      🌐 API de datos abiertos
                    </p>
                    <p className="text-sm leading-relaxed text-white/80">
                      Publica una API REST sencilla para que cualquier persona (o
                      aplicación) pueda consultar los datos actuales e históricos de
                      la red. JSON, CSV, lo que prefieras.
                    </p>
                  </div>
                  <div className="bg-[#1b4235] text-white p-6 rounded-lg">
                    <p className="text-[#b88364] text-xs tracking-wider uppercase mb-3">
                      🌍 Contribuir a Windy.com
                    </p>
                    <p className="text-sm leading-relaxed text-white/80">
                      Windy permite que estaciones meteorológicas ciudadanas suban sus
                      datos. Tus mediciones aparecerían en uno de los mapas
                      meteorológicos más usados del mundo.
                    </p>
                  </div>
                  <div className="bg-[#1b4235] text-white p-6 rounded-lg">
                    <p className="text-[#b88364] text-xs tracking-wider uppercase mb-3">
                      🏛️ Compartir con CONAGUA
                    </p>
                    <p className="text-sm leading-relaxed text-white/80">
                      Los datos de tu red pueden complementar las redes oficiales de
                      monitoreo meteorológico en México. Tu estación comunitaria ayuda
                      a llenar vacíos de cobertura.
                    </p>
                  </div>
                  <div className="bg-[#1b4235] text-white p-6 rounded-lg">
                    <p className="text-[#b88364] text-xs tracking-wider uppercase mb-3">
                      🪂 Comunidad de parapente
                    </p>
                    <p className="text-sm leading-relaxed text-white/80">
                      Publica hallazgos, estadísticas estacionales y análisis de
                      condiciones de vuelo en foros y grupos de parapente. Tu
                      experiencia inspira a otras comunidades.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Diagnóstico de problemas */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">
            Solución de problemas
          </p>
          <h2 className="font-serif text-4xl text-[#1b4235] tracking-[-0.02em] mb-4">
            Problemas comunes y cómo resolverlos
          </h2>
          <p className="text-[#5c3d2e] mb-12 leading-relaxed max-w-2xl">
            Cuando algo falla, no entres en pánico. La mayoría de los problemas
            tienen causas simples y soluciones directas. Aquí tienes una guía de
            diagnóstico rápido.
          </p>

          <div className="space-y-4">
            {[
              {
                icon: '📡',
                problem: 'Estación fuera de línea',
                cause:
                  'Sin datos en el dashboard por más de 1 hora.',
                steps: [
                  'Revisa el panel solar: ¿está bloqueado por algo? ¿Está sucio?',
                  'Verifica el voltaje de batería en el dashboard si aún envía datos intermitentes.',
                  '¿Hay WiFi o señal 4G en la zona? Puede ser una caída de red.',
                  'Intenta conectarte por SSH. Si responde, el problema es la conexión a internet.',
                  'Si no responde por SSH, visita física: la batería puede estar agotada.',
                  'Revisa los cables de alimentación dentro de la caja estanca.',
                ],
              },
              {
                icon: '💨',
                problem: 'Velocidad del viento en cero',
                cause:
                  'El anemómetro reporta 0 km/h constantemente.',
                steps: [
                  '¿El anemómetro gira libremente? Haz una visita y gíralo con la mano.',
                  'Busca telarañas o insectos dentro de los cubos del anemómetro.',
                  'Revisa si el rodamiento está atascado. Con el tiempo y la intemperie se degradan.',
                  'Verifica la conexión del cable del anemómetro al GPIO.',
                  'Prueba el sensor con un multímetro: ¿genera pulsos al girar?',
                ],
              },
              {
                icon: '🌡️',
                problem: 'Temperatura irreal',
                cause:
                  'Lecturas de temperatura que no coinciden con la sensación térmica.',
                steps: [
                  '¿El sensor está expuesto al sol directo? Necesita un escudo de radiación.',
                  'Verifica que el sensor no esté dentro de la caja estanca (se recalienta).',
                  'Compara con un termómetro de referencia a la sombra.',
                  'Si el error es constante, recalibra o reemplaza el sensor.',
                  'Considera agregar un escudo de radiación solar pasivo (tipo Stevenson).',
                ],
              },
              {
                icon: '🔋',
                problem: 'Datos se detienen a la misma hora',
                cause:
                  'La estación deja de transmitir siempre a la misma hora del día.',
                steps: [
                  'Es casi seguro un problema de batería. La batería se agota durante la noche.',
                  'Verifica el voltaje mínimo en los logs. ¿Baja de 3.3V?',
                  'Solución: batería de mayor capacidad o panel solar más grande.',
                  'También revisa si hay consumo extra (¿se activa algo a esa hora?).',
                  'Como medida temporal, reduce la frecuencia de envío de datos.',
                ],
              },
              {
                icon: '📶',
                problem: 'Conexión intermitente',
                cause:
                  'Los datos llegan a ratos, con huecos frecuentes.',
                steps: [
                  'Revisa el alcance del WiFi: ¿la estación está muy lejos del router?',
                  'Prueba mover la antena WiFi de la Raspberry Pi. A veces unos centímetros hacen diferencia.',
                  'Considera una antena WiFi direccional de mayor ganancia.',
                  'Si usas 4G, verifica la cobertura en esa ubicación exacta con tu celular.',
                  'Revisa interferencias: microondas, equipos de radio, estructuras metálicas cerca.',
                ],
              },
              {
                icon: '💧',
                problem: 'Humedad dentro de la caja',
                cause:
                  'Condensación o agua dentro del gabinete estanco.',
                steps: [
                  'Abre la caja en un día seco. Deja que se ventile.',
                  'Cambia el silica gel inmediatamente. Usa bolsitas frescas.',
                  'Revisa los sellos de goma de la caja. ¿Están agrietados o deformados?',
                  'Verifica que los prensaestopas estén bien apretados.',
                  'Aplica grasa de silicona a los sellos para mantenerlos flexibles.',
                  'Si el problema persiste, taladra un pequeño agujero en la parte inferior (con malla anti-insectos) para drenaje.',
                ],
              },
            ].map((item, i) => (
              <details
                key={i}
                className="group bg-[#faf7f5] rounded-lg border border-[#1b4235]/5 overflow-hidden"
              >
                <summary className="flex items-center gap-4 px-6 py-5 cursor-pointer hover:bg-[#edd3c5]/10 transition-colors list-none">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="font-serif text-lg text-[#1b4235]">
                      {item.problem}
                    </p>
                    <p className="text-sm text-[#5c3d2e]/70">{item.cause}</p>
                  </div>
                  <span className="text-[#b88364] text-sm group-open:rotate-90 transition-transform">
                    ▶
                  </span>
                </summary>
                <div className="px-6 pb-6 pt-2 ml-14 space-y-2">
                  <p className="text-xs text-[#b88364] tracking-wider uppercase mb-3">
                    Pasos de diagnóstico
                  </p>
                  {item.steps.map((step, j) => (
                    <div key={j} className="flex gap-3 items-start">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#b88364]/10 flex items-center justify-center text-xs text-[#b88364] font-bold mt-0.5">
                        {j + 1}
                      </span>
                      <p className="text-sm text-[#5c3d2e]">{step}</p>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>

          <div className="mt-8 bg-[#edd3c5]/30 p-6 rounded-lg border border-[#b88364]/20">
            <p className="font-medium text-[#1b4235] mb-2">
              🧰 Kit de diagnóstico de campo
            </p>
            <p className="text-sm text-[#5c3d2e] leading-relaxed">
              Para las visitas de mantenimiento, lleva siempre: multímetro, cable
              micro USB de repuesto, silica gel fresco, batería de repuesto,
              tarjeta microSD clonada, cinta aislante, limpia contactos y un cuaderno
              para anotar observaciones. Una mochila pequeña con esto te ahorra
              viajes extra.
            </p>
          </div>
        </div>
      </section>

      {/* Sostenibilidad y comunidad */}
      <section className="py-20 bg-[#faf7f5]">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">
            Comunidad
          </p>
          <h2 className="font-serif text-4xl text-[#1b4235] tracking-[-0.02em] mb-4">
            Sostenibilidad y comunidad
          </h2>
          <p className="text-[#5c3d2e] mb-12 leading-relaxed max-w-2xl">
            La tecnología funciona solo si las personas la cuidan. Aquí te compartimos
            prácticas para que la red sobreviva al paso del tiempo y al relevo
            generacional.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-[#1b4235]/5">
              <div className="text-3xl mb-4">👥</div>
              <h3 className="font-serif text-xl text-[#1b4235] mb-3">
                Sistema de rotación
              </h3>
              <p className="text-sm text-[#5c3d2e] leading-relaxed">
                Arma un calendario rotativo de mantenimiento. Cada semana, una
                persona diferente es responsable del chequeo semanal. Así nadie se
                quema y todos desarrollan el hábito. Usa un Google Calendar
                compartido para que sea visible para todo el equipo.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-[#1b4235]/5">
              <div className="text-3xl mb-4">🧑‍🏫</div>
              <h3 className="font-serif text-xl text-[#1b4235] mb-3">
                Formación de relevos
              </h3>
              <p className="text-sm text-[#5c3d2e] leading-relaxed">
                Empareja a los estudiantes con más experiencia con los nuevos. Que
                las visitas de mantenimiento mensuales sean en pareja: uno que ya
                sabe y uno que está aprendiendo. Es la mejor forma de transferir
                conocimiento práctico.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-[#1b4235]/5">
              <div className="text-3xl mb-4">📝</div>
              <h3 className="font-serif text-xl text-[#1b4235] mb-3">
                Documentación viva
              </h3>
              <p className="text-sm text-[#5c3d2e] leading-relaxed">
                Mantén la documentación actualizada. Cada vez que resuelvas un
                problema nuevo o cambies algo del sistema, actualiza la guía. Un
                repositorio compartido (Google Drive, Notion, GitHub) asegura que el
                conocimiento no se pierda cuando alguien se va.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-[#1b4235]/5">
              <div className="text-3xl mb-4">🎉</div>
              <h3 className="font-serif text-xl text-[#1b4235] mb-3">
                Celebrar hitos
              </h3>
              <p className="text-sm text-[#5c3d2e] leading-relaxed">
                No dejes que el trabajo pase desapercibido. Celebren juntos cuando
                alcancen hitos: 1,000 horas de datos acumulados, la primera tormenta
                registrada por la red, un año de operación continua, la estación #5
                instalada. Unas pizzas en el Hangar o un vuelo grupal son la mejor
                motivación.
              </p>
            </div>

            <div className="md:col-span-2 bg-[#1b4235] text-white p-8 rounded-lg">
              <h3 className="font-serif text-2xl mb-4">
                🎯 Ideas para celebrar
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-[#b88364] font-medium">1,000 horas</p>
                  <p className="text-sm text-white/70">
                    Primer hito de datos. Compartan una gráfica de las primeras
                    1,000 horas en redes sociales.
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[#b88364] font-medium">
                    Primera tormenta registrada
                  </p>
                  <p className="text-sm text-white/70">
                    Capturaste un evento meteorológico real. Analicen los datos en
                    equipo y publiquen un resumen.
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[#b88364] font-medium">1 año continuo</p>
                  <p className="text-sm text-white/70">
                    Un año sin interrupciones mayores. Hora de la reunión anual y
                    una cena de celebración.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reflexión final */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-6">
            Reflexión
          </p>
          <blockquote className="font-serif text-3xl text-[#1b4235] leading-relaxed mb-6">
            &ldquo;La red no son los sensores ni las Raspberry Pi. La red son las
            personas que la cuidan, los pilotos que la consultan antes de volar, los
            estudiantes que aprenden y enseñan.&rdquo;
          </blockquote>
          <p className="text-[#5c3d2e] max-w-xl mx-auto leading-relaxed">
            Mantener viva una estación meteorológica comunitaria es un acto de
            servicio al vuelo libre. Cada dato que recolectan hace más seguro el
            deporte y más sabia a la comunidad. Gracias por ser parte.
          </p>
        </div>
      </section>

      {/* Navegación entre fases */}
      <section className="py-16 bg-[#1b4235] text-white">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <Link
            href="/comunidad/fase-5-instalacion"
            className="group flex items-center gap-4 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          >
            <span className="text-2xl group-hover:-translate-x-1 transition-transform">
              ←
            </span>
            <div>
              <p className="text-xs text-[#b88364] tracking-wider uppercase">
                Anterior
              </p>
              <p className="text-lg font-serif">Fase 5: Instalación</p>
            </div>
          </Link>

          <Link
            href="/comunidad"
            className="group flex items-center gap-4 px-8 py-4 bg-[#b88364]/20 hover:bg-[#b88364]/30 rounded-lg transition-all border border-[#b88364]/30"
          >
            <div className="text-center">
              <p className="text-xs text-[#b88364] tracking-wider uppercase">
                Curso completo
              </p>
              <p className="text-lg font-serif">Volver al índice</p>
            </div>
            <span className="text-2xl">☰</span>
          </Link>
        </div>
      </section>

      <footer className="bg-[#0f2a20] text-white/30 py-12 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs tracking-[0.3em] uppercase mb-2">
            Hangar 5 · Comunidad
          </p>
          <p className="text-xs">
            <Link
              href="/comunidad"
              className="hover:text-white/60 transition-colors"
            >
              Curso completo
            </Link>
            {' · '}Curso gratuito y abierto · © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </main>
  );
}
