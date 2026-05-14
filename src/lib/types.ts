export type ItemType = "cabana" | "glamping" | "moto" | "bici";
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
