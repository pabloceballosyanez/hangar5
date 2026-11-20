import type { Metadata } from "next";
import { Gloock, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const gloock = Gloock({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-gloock",
  display: "swap",
});

/* Plus Jakarta Sans — voz de operación.
   Reemplaza a Work Sans (nov-2026). Dos razones:

   1. Work Sans se cargaba solo hasta el peso 600, pero los tokens piden
      800. El navegador inventaba el peso engordando la letra a la fuerza
      y los títulos salían sucios. Aquí están los cinco pesos reales.

   2. En una tablet a un brazo de distancia, los números de la variante
      Jakarta (más altos y abiertos) se leen mejor que los de Work Sans,
      y la mitad de lo que se mira en estas pantallas son precios y horas.
*/
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Hangar 5 — Reserva tu experiencia",
  description: "Cabañas, glampings, parapente y cocina de montaña en El Peñón, Temascaltepec",
  appleWebApp: {
    capable: true,
    title: "Hangar 5",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0B0B0B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${gloock.variable} ${jakarta.variable}`}>
      <body className={`${jakarta.variable} ${gloock.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
