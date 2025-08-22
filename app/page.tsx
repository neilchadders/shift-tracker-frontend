"use client";

import { useEffect, useState } from "react";
import { Shift } from "../types/shifts";
import { calculateEarnings } from "../utils/time";
import AddShiftForm from "../components/AddShiftForm";
import ShiftList from "../components/ShiftList";

export default function HomePage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

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

  const handleAddShift = (shift: Shift) => {
    setShifts(prev => [...prev, shift]);
    const hours = (new Date(`1970-01-01T${shift.endTime}`).getTime() - new Date(`1970-01-01T${shift.startTime}`).getTime()) / (1000*60*60);
    setTotalHours(prev => prev + hours);
    setTotalEarnings(prev => prev + hours * shift.hourlyRate);
  };

  const handleDeleteShift = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5137/shifts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete shift");
      const removedShift = shifts.find(s => s.id === id);
      setShifts(prev => prev.filter(s => s.id !== id));
      if (removedShift) {
        const hours = (new Date(`1970-01-01T${removedShift.endTime}`).getTime() - new Date(`1970-01-01T${removedShift.startTime}`).getTime()) / (1000*60*60);
        setTotalHours(prev => prev - hours);
        setTotalEarnings(prev => prev - hours * removedShift.hourlyRate);
      }
    } catch (err) {
      console.error("Error deleting shift:", err);
    }
  };

  return (
    <div>
      <h1>Shift Tracker</h1>

      <label>
        Select Month:
        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
      </label>

      <AddShiftForm onShiftAdded={handleAddShift} />
      <ShiftList
        shifts={shifts}
        totalHours={totalHours}
        totalEarnings={totalEarnings}
        onDelete={handleDeleteShift}
      />
    </div>
  );
}
