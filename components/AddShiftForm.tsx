"use client";

import { useState, useEffect } from "react";
import { Shift } from "../types/shifts";

interface AddShiftFormProps {
  onShiftAdded: (shift: Shift) => void;
  initialData?: Shift;
  isEditing?: boolean;
  onCancelEdit?: () => void;
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

  // Populate form when editing
  useEffect(() => {
  if (initialData) {
    // Ensure correct formats for inputs
    setDate(initialData.date.split("T")[0]); // YYYY-MM-DD
    setStartTime(initialData.startTime.substring(11, 16)); // HH:mm
    setEndTime(initialData.endTime.substring(11, 16)); // HH:mm
    setHourlyRate(initialData.hourlyRate.toString());
  } else {
    setDate("");
    setStartTime("");
    setEndTime("");
    setHourlyRate("");
  }
}, [initialData]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      date,
      startTime,
      endTime,
      hourlyRate: parseFloat(hourlyRate),
      id: initialData?.id, // Include ID for editing
    };

    try {
      let res;
      if (isEditing && initialData) {
        // Update existing shift
        res = await fetch(`http://localhost:5137/shifts/${initialData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Add new shift
        res = await fetch("http://localhost:5137/shifts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error(isEditing ? "Failed to update shift" : "Failed to add shift");

      const data = await res.json();
      onShiftAdded(data);

      // Reset form if adding new shift
      if (!isEditing) {
        setDate("");
        setStartTime("");
        setEndTime("");
        setHourlyRate("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isEditing ? "Edit Shift" : "Add Shift"}</h2>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <input
        type="time"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
        required
      />
      <input
        type="time"
        value={endTime}
        onChange={(e) => setEndTime(e.target.value)}
        required
      />
      <input
        type="number"
        step="0.01"
        value={hourlyRate}
        onChange={(e) => setHourlyRate(e.target.value)}
        required
      />
      <button type="submit">{isEditing ? "Update Shift" : "Add Shift"}</button>
      {isEditing && onCancelEdit && (
        <button type="button" onClick={onCancelEdit}>
          Cancel
        </button>
      )}
    </form>
  );
}
