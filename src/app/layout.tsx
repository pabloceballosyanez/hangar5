import type { Metadata } from "next";
import { Gloock, Work_Sans } from "next/font/google";
import "./globals.css";

// Tipografía — definida UNA vez para toda la app.
// Gloock: voz display (títulos). Work Sans: voz de texto (reemplaza
// a system-ui desde oct-2026; tiene curvas más humanas y aguanta los
// textos largos de las fichas).
const gloock = Gloock({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-gloock",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Hangar 5 — Reserva tu experiencia",
  description: "Cabañas, glampings, motos y bicicletas en El Peñón Temascaltepec",
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
  themeColor: "#0B0C0B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${gloock.variable} ${workSans.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
