export type ItemType = "cabana" | "glamping" | "moto" | "bici" | "parapente" | "aladelta" | "hike";
export type BookingStatus = "pending" | "paid" | "confirmed" | "cancelled";

export interface BookingFormData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  startDate: string;
  endDate: string;
  guests: number;
  notes?: string;
}

export function isRental(type: string): boolean {
  return type === "moto" || type === "bici";
}

export function isActivity(type: string): boolean {
  return type === "parapente" || type === "aladelta" || type === "hike";
}

export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    cabana: "Cabaña",
    glamping: "Glamping",
    moto: "Moto",
    bici: "Bicicleta",
    parapente: "Parapente",
    aladelta: "Ala Delta",
    hike: "Hike",
  };
  return labels[type] || type;
}
