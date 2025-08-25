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

  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  function sortShifts(list: Shift[]): Shift[] {
    return [...list].sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.startTime.localeCompare(b.startTime);
    });
  }

  const fetchShifts = async (month: string) => {
    try {
      const res = await fetch(`http://localhost:5137/shifts?month=${month}`);
      if (!res.ok) throw new Error("Failed to fetch shifts");
      const data = await res.json();
      setShifts(sortShifts(data.shifts));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchShifts(selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    const totalHrs = shifts.reduce((sum, s) => sum + s.totalHours, 0);
    const totalPay = calculateEarnings(shifts);
    setTotalHours(totalHrs);
    setTotalEarnings(totalPay);
  }, [shifts]);

  const handleAddOrUpdateShift = (shift: Shift) => {
    setShifts((prev) => {
      const exists = prev.find((s) => s.id === shift.id);
      let updated: Shift[];
      if (exists) {
        updated = prev.map((s) => (s.id === shift.id ? shift : s));
      } else {
        updated = [...prev, shift];
      }
      return sortShifts(updated);
    });

    setEditingShift(null);
  };

  const handleDeleteShift = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5137/shifts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete shift");
      setShifts((prev) => sortShifts(prev.filter((s) => s.id !== id)));
    } catch (err) {
      console.error("Error deleting shift:", err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">Shift Tracker</h1>

      {/* Month Selector */}
      <div className="mb-6 flex justify-center">
        <label className="flex items-center gap-2 text-gray-700 font-medium">
          Select Month:
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded px-3 py-1"
          />
        </label>
      </div>

      {/* Totals Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-100 rounded-lg shadow p-4 text-center">
          <p className="text-gray-600">Total Hours</p>
          <p className="text-2xl font-bold text-blue-800">{totalHours.toFixed(1)}</p>
        </div>
        <div className="bg-green-100 rounded-lg shadow p-4 text-center">
          <p className="text-gray-600">Total Earnings</p>
          <p className="text-2xl font-bold text-green-800">£{totalEarnings.toFixed(2)}</p>
        </div>
      </div>

      {/* Add/Edit Form */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow">
        <AddShiftForm
          onShiftAdded={handleAddOrUpdateShift}
          initialData={editingShift || undefined}
          isEditing={!!editingShift}
        />
        {editingShift && (
          <button
            onClick={() => setEditingShift(null)}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            ➕ Add New Shift
          </button>
        )}
      </div>

      {/* Shift List */}
      <div className="bg-white rounded-lg shadow p-4">
        <ShiftList
          shifts={shifts}
          totalHours={totalHours}
          totalEarnings={totalEarnings}
          onDelete={handleDeleteShift}
          onEdit={setEditingShift}
        />
      </div>
    </div>
  );
}
