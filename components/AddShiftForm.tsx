"use client";

import { useState } from "react";
import { Shift } from "../types/shifts";

interface AddShiftFormProps {
  onShiftAdded: (shift: Shift) => void;
}

export default function AddShiftForm({ onShiftAdded }: AddShiftFormProps) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch("http://localhost:5137/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        startTime,
        endTime,
        hourlyRate: parseFloat(hourlyRate),
      }),
    });

    if (response.ok) {
      const newShift: Shift = await response.json();
      onShiftAdded(newShift); // update parent
      setDate("");
      setStartTime("");
      setEndTime("");
      setHourlyRate("");
    } else {
      alert("Error adding shift");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
      <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
      <input type="number" step="0.01" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} required />
      <button type="submit">Add Shift</button>
    </form>
  );
}
