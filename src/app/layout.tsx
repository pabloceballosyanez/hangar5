import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hangar 5 — Reserva tu experiencia",
  description: "Cabañas, glampings, motos y bicicletas en El Peñón Temascaltepec",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
