// components/ShiftCalendar.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../utils/api";
import type { ShiftDto, ShiftsResponse } from "../types/shifts";

interface Props {
  selectedMonth: string;                    // "YYYY-MM"
  setSelectedMonth: (value: string) => void;
  refreshKey?: number;                      // bump to refetch after add/edit
  onEditShift?: (shift: ShiftDto) => void;  // open AddShiftForm prefilled
}

function formatHHmm(value?: string) {
  return value ? value.slice(0, 5) : "";
}
function daysInMonth(year: number, month1to12: number) {
  return new Date(year, month1to12, 0).getDate();
}
function addMonths(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, (m - 1) + delta, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

export default function ShiftCalendar({
  selectedMonth,
  setSelectedMonth,
  refreshKey = 0,
  onEditShift,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ShiftsResponse | null>(null);
  const [monthlyRate, setMonthlyRate] = useState<string>("");

  const [year, month] = useMemo(
    () => selectedMonth.split("-").map(Number) as [number, number],
    [selectedMonth]
  );

  const days = useMemo(() => {
    const total = daysInMonth(year, month);
    return Array.from({ length: total }, (_, i) => i + 1);
  }, [year, month]);

  const shiftsByDay = useMemo(() => {
    const map: Record<number, ShiftDto[]> = {};
    if (!data) return map;
    for (const s of data.shifts) {
      const day = parseInt(s.date.slice(8, 10), 10);
      (map[day] = map[day] || []).push(s);
    }
    for (const k of Object.keys(map)) {
      map[+k].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [data]);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/shifts?month=${selectedMonth}`);
      if (!res.ok) throw new Error(await res.text());
      const payload: ShiftsResponse = await res.json();
      setData(payload);
      setMonthlyRate(String(payload.monthlyDefaultRate ?? 0));
    } catch (e) {
      console.error(e);
      alert("Failed to load shifts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, refreshKey]);

  async function toggleCompleted(shift: ShiftDto, completed: boolean) {
    try {
      const res = await fetch(`${API_BASE}/shifts/${shift.id}/completed`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completed),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Failed to update completion");
    }
  }

  async function saveMonthlyRate() {
    try {
      const val = parseFloat(monthlyRate);
      if (Number.isNaN(val) || val < 1 || val > 1000) {
        alert("Monthly hourly rate must be between 1 and 1000");
        return;
      }
      const res = await fetch(`${API_BASE}/monthly-rate?month=${selectedMonth}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hourlyRate: val }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Failed to save monthly rate");
    }
  }

  // Override rate per shift (blank => use monthly default)
  async function updateShiftRate(shift: ShiftDto, newRate: string) {
    const trimmed = newRate.trim();
    const num: number | null = trimmed === "" ? null : Number(trimmed);
    if (num !== null && (Number.isNaN(num) || num < 1 || num > 1000)) {
      alert("Hourly rate must be 1–1000 or blank to use monthly default");
      return;
    }
    try {
      const body = {
        id: shift.id,
        date: `${shift.date}T00:00:00`,
        startTime: shift.startTime,
        endTime: shift.endTime,
        hourlyRate: num,
        isCompleted: shift.isCompleted,
      };
      const res = await fetch(`${API_BASE}/shifts/${shift.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Failed to update shift rate");
    }
  }

  // put this near your other helpers
const handleDeleteClick = (id: number) => async (
  e: React.MouseEvent<HTMLButtonElement>
) => {
  // HARD LOGS — if you don't see these, the button isn't receiving the event
  console.log("[delete] onClick fired for id:", id);
  e.preventDefault();
  e.stopPropagation();

  if (!confirm("Delete this shift?")) {
    console.log("[delete] user cancelled");
    return;
  }

  // Optimistic UI removal so it disappears immediately
  setData(prev => {
    if (!prev) return prev;
    const removed = prev.shifts.find(s => s.id === id);
    if (!removed) {
      console.warn("[delete] id not found in state:", id);
      return prev;
    }
    console.log("[delete] optimistically removing:", id);
    return {
      ...prev,
      shifts: prev.shifts.filter(s => s.id !== id),
      totalHours: prev.totalHours - removed.totalHours,
      totalPay: prev.totalPay - removed.pay,
    };
  });

  try {
    const url = `${API_BASE}/shifts/${id}`;
    console.log("[delete] fetch:", url);
    const res = await fetch(url, { method: "DELETE" });
    console.log("[delete] response status:", res.status);

    if (res.status !== 204 && !res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || `Delete failed (${res.status})`);
    }

    // Optional re-sync:
    // await fetchAll();
  } catch (err) {
    console.error("[delete] error:", err);
    alert("Failed to delete shift");
    await fetchAll(); // rollback by reloading from server
  }
};


  const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const weekLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const blanks = Array.from({ length: firstDayIndex });

  return (
    <div className="space-y-4">
      {/* Header: month nav + monthly rate setter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
            className="px-2 py-1 border rounded"
          >
            ←
          </button>
          <div className="text-xl font-semibold">
            {new Date(year, month - 1).toLocaleString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </div>
          <button
            onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
            className="px-2 py-1 border rounded"
          >
            →
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Monthly hourly rate:</label>
          <input
            type="number"
            step="0.01"
            min="1"
            max="1000"
            value={monthlyRate}
            onChange={(e) => setMonthlyRate(e.target.value)}
            className="border rounded px-2 py-1 w-28"
          />
          <button
            onClick={saveMonthlyRate}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 text-center">
        {weekLabels.map((w) => (
          <div key={w} className="text-xs font-medium text-gray-600">
            {w}
          </div>
        ))}

        {blanks.map((_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {days.map((d) => {
          const list = shiftsByDay[d] || [];
          return (
            <div key={d} className="border rounded p-2 text-left min-h-[140px]">
              <div className="text-sm font-semibold mb-1">{d}</div>
              <div className="space-y-2">
                {list.length === 0 ? (
                  <div className="text-xs text-gray-400">No shifts</div>
                ) : (
                  list.map((s) => (
                    <div key={s.id} className="border rounded p-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          {formatHHmm(s.startTime)}–{formatHHmm(s.endTime)}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                           type="button"      
                            className="text-xs px-2 py-0.5 border rounded"
                            onClick={() => onEditShift?.(s)}
                            title="Edit shift"
                          >
                            Edit
                          </button>
          <button
  type="button"
  onClick={handleDeleteClick(s.id)}
  onMouseDown={(e) => { /* backup path if onClick is swallowed */
    e.preventDefault();
    e.stopPropagation();
    console.log("[delete] onMouseDown fired for id:", s.id);
  }}
  className="relative z-10 pointer-events-auto text-xs px-2 py-0.5 border rounded text-red-600"
  title="Delete shift"
  aria-label={`Delete shift ${s.id}`}
  data-shift-id={s.id}
>
  Delete
</button>



                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={s.isCompleted}
                            onChange={(e) => toggleCompleted(s, e.target.checked)}
                          />
                          Completed
                        </label>

                        <div className="text-xs">Hours: {s.totalHours.toFixed(2)}</div>
                      </div>

                      <div className="mt-2 flex items-center gap-1 text-xs">
                        <span>Rate:</span>
                        <input
                          defaultValue={s.hourlyRate ?? ""}
                          placeholder={`← blank = £${s.effectiveHourlyRate.toFixed(2)}`}
                          className="border rounded px-1 py-0.5 w-28"
                          onBlur={(e) => updateShiftRate(s, e.target.value)}
                          title="Leave blank to use monthly default"
                        />
                        <span className="ml-auto">Pay: £{s.pay.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="flex items-center justify-end gap-6 text-sm">
        <div>
          Total hours: <strong>{(data?.totalHours ?? 0).toFixed(2)}</strong>
        </div>
        <div>
          Total pay: <strong>£{(data?.totalPay ?? 0).toFixed(2)}</strong>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
    </div>
  );
}
