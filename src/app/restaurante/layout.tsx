import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Restaurante | Hangar Cinco',
  description: 'Cocina artesanal con vistas a la montaña en El Peñón, Temascaltepec',
};

export default function RestauranteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
