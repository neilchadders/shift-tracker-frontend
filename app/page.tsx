"use client";

import { useState } from "react";
import AddShiftForm from "../components/AddShiftForm";
import ShiftCalendar from "../components/ShiftCalendar";
import type { ShiftDto } from "../types/shifts";

export default function HomePage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingShift, setEditingShift] = useState<ShiftDto | undefined>(undefined);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center text-blue-700">Shift Tracker</h1>

      <div className="flex justify-center">
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

      <div className="bg-gray-50 p-4 rounded-lg shadow">
        <AddShiftForm
          onShiftAdded={() => setRefreshKey((k) => k + 1)}
          initialData={editingShift}
          isEditing={!!editingShift}
          onCancelEdit={() => setEditingShift(undefined)}
        />
        {editingShift && (
          <button
            onClick={() => setEditingShift(undefined)}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            ➕ Add New Shift
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <ShiftCalendar
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          refreshKey={refreshKey}
          onEditShift={(s) => setEditingShift(s)}  
        />
      </div>
    </div>
  );
}
