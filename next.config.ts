import type { NextConfig } from "next";

/**
 * ============================================================
 * VERSIONADO AUTOMÁTICO — para que los clientes siempre vean
 * los cambios sin tener que hacer recarga forzada.
 *
 * EL PROBLEMA
 * Las páginas y las imágenes ya se sirven sin caché (max-age=0),
 * pero el CSS y las fuentes se guardan 1 año porque su nombre
 * lleva un hash que solo cambia cuando su contenido cambia.
 * Eso está bien: si el CSS cambia, el nombre cambia y el
 * navegador lo vuelve a pedir.
 *
 * EL RIESGO REAL
 * El navegador guarda el HTML de la página. Si el HTML es viejo,
 * apunta al CSS viejo — aunque el CSS nuevo ya esté publicado.
 * Y quien tenga el HTML en caché ve la versión anterior.
 *
 * LA SOLUCIÓN
 * Una etiqueta de versión que cambia con cada despliegue,
 * inyectada en el HTML. Cuando cambia, el navegador entiende
 * que la página es nueva y pide todo de vuelta.
 *
 * De dónde sale la versión: Render publica el commit desplegado
 * en la variable RENDER_GIT_COMMIT. Si no está, se usa la fecha
 * del build. Así nunca hay que subir un número a mano.
 * ============================================================ */

const VERSION =
  process.env.RENDER_GIT_COMMIT?.slice(0, 7) ||
  process.env.NEXT_PUBLIC_APP_VERSION ||
  String(Date.now());

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // La versión del despliegue, visible para diagnóstico
  { key: "X-App-Version", value: VERSION },
];

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,

  env: {
    // Disponible en el código como process.env.NEXT_PUBLIC_APP_VERSION
    NEXT_PUBLIC_APP_VERSION: VERSION,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Las imágenes del sitio: siempre revalidar.
        // Su URL puede quedarse igual aunque el archivo mejore
        // (ej. una foto re-exportada con mejor calidad), así que
        // no conviene guardarlas por mucho tiempo.
        source: "/img/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
