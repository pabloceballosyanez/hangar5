import { prisma } from "@/lib/prisma";
import { getTypeLabel, isActivity } from "@/lib/types";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const bookings = await prisma.booking.findMany({
    include: { item: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const items = await prisma.item.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] });

  const cabanas = items.filter(i => i.type === "cabana" || i.type === "glamping");
  const activities = items.filter(i => isActivity(i.type));
  const rentals = items.filter(i => i.type === "moto" || i.type === "bici");

  return <AdminClient
    bookings={JSON.parse(JSON.stringify(bookings))}
    items={items}
    cabanas={JSON.parse(JSON.stringify(cabanas))}
    activities={JSON.parse(JSON.stringify(activities))}
    rentals={JSON.parse(JSON.stringify(rentals))}
  />;
}
