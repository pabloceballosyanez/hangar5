import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * /pedir — redirects to the restaurant menu for online ordering.
 * Uses a default table token. The QR session will be created automatically.
 */
export default function PedirPage() {
  redirect("/menu/t1");
}
