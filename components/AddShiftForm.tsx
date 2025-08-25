"use client";

import React, { useEffect, useState } from "react";
import { Shift } from "../types/shifts";

interface AddShiftFormProps {
  onShiftAdded: (shift: Shift) => void;
  initialData?: Shift;
  isEditing?: boolean;
  onCancelEdit?: () => void;
}

// ---------- helpers ----------
function toDateInput(value: string) {
  // Handles "YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss", etc.
  if (!value) return "";
  const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

function toTimeInput(value: string) {
  // Accepts "HH:mm", "HH:mm:ss", or "PT1H30M" (ISO duration) -> "HH:mm"
  if (!value) return "";
  if (value.startsWith("P")) {
    const h = /(\d+)H/.exec(value)?.[1] ?? "0";
    const m = /(\d+)M/.exec(value)?.[1] ?? "0";
    return `${String(Number(h)).padStart(2, "0")}:${String(Number(m)).padStart(2, "0")}`;
  }
  if (value.includes(":")) return value.slice(0, 5);
  return "";
}

function toApiTime(hhmm: string) {
  // Ensure "HH:mm:ss" for TimeSpan model binding
  if (!hhmm) return "";
  return hhmm.length === 5 ? `${hhmm}:00` : hhmm;
}

export default function AddShiftForm({
  onShiftAdded,
  initialData,
  isEditing = false,
  onCancelEdit,
}: AddShiftFormProps) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Prefill when editing
  useEffect(() => {
    if (initialData) {
      setDate(toDateInput(initialData.date));
      setStartTime(toTimeInput(initialData.startTime));
      setEndTime(toTimeInput(initialData.endTime));
      setHourlyRate(initialData.hourlyRate?.toString() ?? "");
    } else {
      setDate("");
      setStartTime("");
      setEndTime("");
      setHourlyRate("");
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid date");
      if (!/^\d{2}:\d{2}(:\d{2})?$/.test(startTime)) throw new Error("Invalid start time");
      if (!/^\d{2}:\d{2}(:\d{2})?$/.test(endTime)) throw new Error("Invalid end time");
      if (!hourlyRate || Number.isNaN(parseFloat(hourlyRate))) throw new Error("Invalid hourly rate");

      setSubmitting(true);

      const payload: Shift = {
        id: initialData?.id || 0,
        date: `${date}T00:00:00`,        // anchor at midnight
        startTime: toApiTime(startTime), // "HH:mm:ss" for TimeSpan
        endTime: toApiTime(endTime),     // "HH:mm:ss" for TimeSpan
        hourlyRate: parseFloat(hourlyRate),
      };

      const method = isEditing ? "PUT" : "POST";
      const url = isEditing
        ? `http://localhost:5137/shifts/${payload.id}`
        : "http://localhost:5137/shifts";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(
          (isEditing ? "Failed to update shift" : "Failed to add shift") +
            (msg ? `: ${msg}` : "")
        );
      }

      const savedShift = await res.json();
      onShiftAdded(savedShift);

      // If we were editing, go back to add mode
      if (isEditing && onCancelEdit) onCancelEdit();

      // If adding, reset the form
      if (!isEditing) {
        setDate("");
        setStartTime("");
        setEndTime("");
        setHourlyRate("");
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 p-4 border rounded shadow-sm">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
        className="border rounded px-2 py-1 w-full"
      />
      <input
        type="time"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
        required
        className="border rounded px-2 py-1 w-full"
      />
      <input
        type="time"
        value={endTime}
        onChange={(e) => setEndTime(e.target.value)}
        required
        className="border rounded px-2 py-1 w-full"
      />
      <input
        type="number"
        step="0.01"
        min="0"
        value={hourlyRate}
        onChange={(e) => setHourlyRate(e.target.value)}
        required
        placeholder="Hourly rate"
        className="border rounded px-2 py-1 w-full"
      />

      <div className="flex space-x-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? (isEditing ? "Updating..." : "Adding...") : isEditing ? "Update Shift" : "Add Shift"}
        </button>
        {isEditing && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
