"use client";

import { useState, useEffect } from "react";

type BlockedDate = { start: Date; end: Date };

export function ItemCalendar({ itemId }: { itemId: string }) {
  const [blocked, setBlocked] = useState<BlockedDate[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
      }).catch(() => {});
  }, [itemId]);

  const isBlocked = (date: Date) => blocked.some(b => date >= b.start && date <= b.end);
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const today = new Date();
  const dayNames = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#b88364]/10 text-[#b88364] transition-colors">
          ←
        </button>
        <span className="text-sm font-medium text-[#1b4235] uppercase tracking-wider">
          {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#b88364]/10 text-[#b88364] transition-colors">
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {dayNames.map(d => (
          <div key={d} className="text-[10px] text-[#b88364]/60 font-medium uppercase tracking-wider py-2">{d}</div>
        ))}
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`e-${i}`} className="py-2" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
          const blockedDate = isBlocked(date);
          const past = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const todayClass = !past && !blockedDate && date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
          
          return (
            <div key={i} className={`py-2 text-xs rounded transition-colors ${
              blockedDate ? "bg-[#fef0ef] text-[#b88364]/40 line-through cursor-not-allowed" :
              past ? "text-gray-300 cursor-not-allowed" :
              todayClass ? "bg-[#1b4235] text-white font-medium" :
              "hover:bg-[#b88364]/10 cursor-pointer text-[#1b4235]"
            }`}>
              {i + 1}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-6 mt-4 text-[10px] text-[#5c3d2e]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#fef0ef] border border-red-200 inline-block" /> Reservado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-white border border-[#b88364]/20 inline-block" /> Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1b4235] inline-block" /> Hoy
        </span>
      </div>
    </div>
  );
}
