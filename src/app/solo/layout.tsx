import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Modo Solo — Hangar 5",
  description: "Pantalla unificada de pedidos, cocina y gestión",
};

export default function SoloLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
