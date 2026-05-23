import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KDS — Hangar 5 Cocina",
  description: "Kitchen Display System — Hangar 5",
};

export default function KDSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {children}
    </div>
  );
}
