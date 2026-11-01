import { redirect } from 'next/navigation';

/**
 * La caja y el KDS del café ahora son UNA sola pantalla.
 *
 * Antes había /cafe/caja para vender y /cafe para entregar, y el
 * barista tenía que saltar entre las dos. Un barco de café no funciona
 * así: se toma el pedido, se cobra, se prepara y se entrega, todo en el
 * mismo lugar.
 *
 * Esta ruta se queda solo como puente para cualquier enlace viejo o
 * marcador guardado en la tablet.
 */
export default function CajaRedirect() {
  redirect('/cafe');
}
