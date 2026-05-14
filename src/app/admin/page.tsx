import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const bookings = await prisma.booking.findMany({
    include: { item: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-blue-100 text-blue-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const items = await prisma.item.findMany();

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-medium text-[#1b4235] uppercase tracking-wider">Hangar 5 — Admin</h1>
          <div className="text-sm text-[#b88364] space-x-4">
            <span>{bookings.length} reservas</span>
            <span>{items.length} items</span>
          </div>
        </div>

        <section className="mb-16">
          <h2 className="text-xl font-medium text-[#1b4235] uppercase tracking-wider mb-6">Items</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {items.map((item) => (
              <div key={item.id} className="border p-4">
                <p className="font-medium text-[#1b4235] text-sm">{item.name}</p>
                <p className="text-xs text-[#b88364]">{item.type}</p>
                <p className="text-sm font-bold">${(item.price / 100).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[#1b4235] uppercase tracking-wider mb-6">Reservas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[#b88364] uppercase tracking-wider text-xs">
                  <th className="py-3 pr-4">Item</th>
                  <th className="py-3 pr-4">Cliente</th>
                  <th className="py-3 pr-4">Entrada</th>
                  <th className="py-3 pr-4">Salida</th>
                  <th className="py-3 pr-4">Total</th>
                  <th className="py-3 pr-4">Estado</th>
                  <th className="py-3">ID</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium">{b.item.name}</td>
                    <td className="py-3 pr-4">{b.customerName}<br /><span className="text-xs text-gray-400">{b.customerEmail}</span></td>
                    <td className="py-3 pr-4">{new Date(b.startDate).toLocaleDateString("es-MX")}</td>
                    <td className="py-3 pr-4">{new Date(b.endDate).toLocaleDateString("es-MX")}</td>
                    <td className="py-3 pr-4 font-medium">${(b.totalPrice / 100).toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 text-xs uppercase ${statusColors[b.status] || ""}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-gray-400">{b.id.slice(-8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
