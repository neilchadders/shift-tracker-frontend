"use client";

import { useEffect, useState } from "react";
import { Shift } from "../types/shifts";
import AddShiftForm from "../components/AddShiftForm";
import ShiftList from "../components/ShiftList";
import { calculateEarnings } from "../utils/time";

export default function HomePage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  // Fetch shifts for selected month
  const fetchShifts = async (month: string) => {
    try {
      const res = await fetch(`http://localhost:5137/shifts?month=${month}`);
      if (!res.ok) throw new Error("Failed to fetch shifts");
      const data = await res.json();
      setShifts(data.shifts);
      setTotalHours(data.totalHours);
      setTotalEarnings(calculateEarnings(data.shifts));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchShifts(selectedMonth);
  }, [selectedMonth]);

  // Add or update a shift
  const handleAddOrUpdateShift = (shift: Shift) => {
    if (editingShift) {
      // Update existing shift in state
      setShifts(prev =>
        prev.map(s => (s.id === shift.id ? shift : s))
      );
      setEditingShift(null);
    } else {
      // Add new shift
      setShifts(prev => [...prev, shift]);
    }
    // Recalculate totals
    setTotalHours(prev => calculateTotalHours());
    setTotalEarnings(prev => calculateEarnings(shifts));
  };

  const handleDeleteShift = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5137/shifts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete shift");
      setShifts(prev => prev.filter(s => s.id !== id));
      setTotalHours(calculateTotalHours());
      setTotalEarnings(calculateEarnings(shifts));
    } catch (err) {
      console.error("Error deleting shift:", err);
    }
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
  };

  const handleCancelEdit = () => {
    setEditingShift(null);
  };

  // Helper: recalculate total hours
  const calculateTotalHours = () => {
    return shifts.reduce((sum, s) => {
      const hours =
        (new Date(`1970-01-01T${s.endTime}`).getTime() -
          new Date(`1970-01-01T${s.startTime}`).getTime()) /
        (1000 * 60 * 60);
      return sum + hours;
    }, 0);
  };

  return (
    <div>
      <h1>Shift Tracker</h1>

      <label>
        Select Month:
        <input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
        />
      </label>

      <AddShiftForm
        onShiftAdded={handleAddOrUpdateShift}
        initialData={editingShift || undefined}
        isEditing={!!editingShift}
        onCancelEdit={handleCancelEdit}
      />

      <ShiftList
        shifts={shifts}
        totalHours={totalHours}
        totalEarnings={totalEarnings}
        onDelete={handleDeleteShift}
        onEdit={handleEditShift}
      />
    </div>
  );
}
