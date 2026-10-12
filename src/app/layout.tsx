import type { Metadata } from "next";
import { Gloock, Work_Sans } from "next/font/google";
import "./globals.css";

const gloock = Gloock({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-gloock",
  display: "swap",
});

// Work Sans — voz de texto. Reemplaza a Inter (sep-2026):
// Inter es la fuente más usada de internet y no aportaba carácter propio.
// Work Sans tiene curvas más humanas y aguanta bien los textos largos
// de las fichas de platillo.
const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
  weight: ["300", "400", "500", "600"],
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
    <html lang="es" className={`${gloock.variable} ${workSans.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
