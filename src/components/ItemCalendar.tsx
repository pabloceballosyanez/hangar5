"use client";

import { useState, useEffect } from "react";

interface BlockedDate { start: Date; end: Date; }

export function ItemCalendar({ itemId }: { itemId: string }) {
  const [blocked, setBlocked] = useState<BlockedDate[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetch(`/api/availability?itemId=${itemId}&start=2020-01-01&end=2030-12-31`)
      .then(r => r.json())
      .then(() => {}); // Just ping
    // For now show a simple message - full calendar can be added
  }, [itemId]);

  // Get all bookings for this item
  useEffect(() => {
    fetch(`/api/bookings?itemId=${itemId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBlocked(data.map((b: { startDate: string; endDate: string }) => ({
            start: new Date(b.startDate),
            end: new Date(b.endDate),
          })));
        }
      })
      .catch(() => {});
  }, [itemId]);

  const isBlocked = (date: Date) => {
    return blocked.some(b => date >= b.start && date <= b.end);
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const today = new Date();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const dayNames = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="text-[#b88364] hover:text-[#1b4235] text-lg">&larr;</button>
        <span className="text-[#1b4235] font-medium uppercase text-sm">
          {currentMonth.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
        </span>
        <button onClick={nextMonth} className="text-[#b88364] hover:text-[#1b4235] text-lg">&rarr;</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {dayNames.map(d => (
          <div key={d} className="text-xs text-[#b88364] font-medium py-1">{d}</div>
        ))}
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
          const blocked = isBlocked(date);
          const past = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          return (
            <div key={i}
              className={`py-2 text-sm rounded ${
                blocked ? "bg-red-100 text-red-400 line-through" :
                past ? "text-gray-300" :
                "hover:bg-[#b88364]/20 cursor-pointer text-[#1b4235]"
              }`}>
              {i + 1}
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 mt-4 text-xs text-[#391b0b]">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 inline-block rounded" /> Reservado</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-white border border-[#b88364]/30 inline-block rounded" /> Disponible</span>
      </div>
    </div>
  );
}
