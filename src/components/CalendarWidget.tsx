import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

export function CalendarWidget({ marks = [] as number[] }: { marks?: number[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { day: number; current: boolean }[] = [];
  for (let i = offset - 1; i >= 0; i -= 1) cells.push({ day: prevMonthDays - i, current: false });
  for (let d = 1; d <= daysInMonth; d += 1) cells.push({ day: d, current: true });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - offset - daysInMonth + 1, current: false });

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="t-panel p-3">
      <h2 className="mb-2 flex items-center justify-between border-b border-[var(--t-line)] pb-1.5 text-[12px] font-bold uppercase text-[var(--t-ink)]">
        Calendario
        <CalendarDays size={13} className="text-[var(--t-blue)]" />
      </h2>
      <div className="mb-1.5 flex items-center justify-between">
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="text-[var(--t-blue)]"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-[12px] font-bold text-[var(--t-ink)]">
          {MONTHS[month]} {year}
        </span>
        <button
          type="button"
          aria-label="Mes siguiente"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="text-[var(--t-blue)]"
        >
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[10px]">
        {DAYS.map((d) => (
          <span key={d} className="font-bold text-[var(--t-ink-soft)]">
            {d}
          </span>
        ))}
        {cells.map((c, i) => (
          <span
            key={`${c.day}-${i}`}
            className={
              !c.current
                ? "text-[oklch(0.85_0.01_245)]"
                : isToday(c.day)
                  ? "mx-auto flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[var(--t-blue)] font-bold text-[var(--t-blue)]"
                  : "text-[var(--t-ink)]"
            }
          >
            {c.day}
            {c.current && marks.includes(c.day) ? (
              <span className="mx-auto block h-[3px] w-[3px] rounded-full bg-[var(--t-blue)]" aria-hidden />
            ) : null}
          </span>
        ))}
      </div>
      <button type="button" className="t-btn mt-2 w-full">
        Ver calendario completo
      </button>
    </div>
  );
}
