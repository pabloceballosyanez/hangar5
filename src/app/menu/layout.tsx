import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Menú - Hangar 5',
  description: 'Menú digital de Hangar 5',
};

export default function MenuRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
