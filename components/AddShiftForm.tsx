"use client";

import React, { useEffect, useState } from "react";
import { ShiftDto, ShiftInput } from "../types/shifts";

interface AddShiftFormProps {
  onShiftAdded: (shift: ShiftDto) => void;
  initialData?: ShiftDto;
  isEditing?: boolean;
  onCancelEdit?: () => void;
}

// ---------- helpers ----------
function toDateInput(value: string) {
  if (!value) return "";
  const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

function toTimeInput(value: string) {
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
  if (!hhmm) return "";
  return hhmm.length === 5 ? `${hhmm}:00` : hhmm;
}

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  try { return JSON.stringify(e); } catch { return String(e); }
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
  const [hourlyRate, setHourlyRate] = useState(""); // blank => monthly default
  const [submitting, setSubmitting] = useState(false);

  // Prefill when editing
  useEffect(() => {
    if (initialData) {
      setDate(toDateInput(initialData.date));
      setStartTime(toTimeInput(initialData.startTime));
      setEndTime(toTimeInput(initialData.endTime));
      setHourlyRate(
        initialData.hourlyRate === null || initialData.hourlyRate === undefined
          ? ""
          : String(initialData.hourlyRate)
      );
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

      // Allow blank => null to use monthly default
      const parsedRate: number | null =
        hourlyRate.trim() === "" ? null : Number.parseFloat(hourlyRate);

      if (parsedRate !== null && (Number.isNaN(parsedRate) || parsedRate < 1 || parsedRate > 1000)) {
        throw new Error("Hourly rate must be between 1 and 1000 (or leave blank for monthly default)");
      }

      setSubmitting(true);

      const payload: ShiftInput = {
        ...(isEditing && initialData?.id ? { id: initialData.id } : {}),
        date: `${date}T00:00:00`,
        startTime: toApiTime(startTime),
        endTime: toApiTime(endTime),
        hourlyRate: parsedRate,
        // isCompleted: initialData?.isCompleted ?? false, // include if you want PUT to preserve
      };

      const method = isEditing ? "PUT" : "POST";
      const url =
        isEditing && initialData?.id
          ? `http://localhost:5137/shifts/${initialData.id}`
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

      const savedShift: ShiftDto = await res.json();
      onShiftAdded(savedShift);

      if (isEditing && onCancelEdit) onCancelEdit();
      if (!isEditing) {
        setDate(""); setStartTime(""); setEndTime(""); setHourlyRate("");
      }
    } catch (e: unknown) {
      console.error(e);
      alert(getErrorMessage(e));
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
        min="1"
        max="1000"
        value={hourlyRate}
        onChange={(e) => setHourlyRate(e.target.value)}
        placeholder="Hourly rate (blank = monthly default)"
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
