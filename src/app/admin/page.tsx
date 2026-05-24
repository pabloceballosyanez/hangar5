import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getTypeLabel, isActivity } from "@/lib/types";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("hangar5_admin_session")?.value !== "true") {
    redirect("/admin/login");
  }
  // Get bookings from 6 months ago to cover dashboard stats + chart
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const bookings = await prisma.booking.findMany({
    where: { startDate: { gte: sixMonthsAgo } },
    include: { item: true },
    orderBy: { createdAt: "desc" },
    take: 500,
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
