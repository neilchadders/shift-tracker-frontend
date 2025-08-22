"use client";

import { useState } from "react";

interface AddShiftFormProps {
  onShiftAdded: () => void; // called after successful add
}

export default function AddShiftForm({ onShiftAdded }: AddShiftFormProps) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch("http://localhost:5137/Shifts", {
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
      alert("Shift added!");
      setDate(""); setStartTime(""); setEndTime(""); setHourlyRate("");
      onShiftAdded(); // tell parent to refresh
    } else {
      alert("Error adding shift");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
      <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
      <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
      <input type="number" step="0.01" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} required />
      <button type="submit">Add Shift</button>
    </form>
  );
}
