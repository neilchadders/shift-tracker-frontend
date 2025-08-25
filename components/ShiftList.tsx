"use client";

import { Shift } from "../types/shifts";

interface ShiftListProps {
  shifts: Shift[];
  totalHours: number;
  totalEarnings: number;
  onDelete: (id: number) => void;
  onEdit: (shift: Shift) => void; // 👈 new
}

export default function ShiftList({ shifts, totalHours, totalEarnings, onDelete, onEdit }: ShiftListProps) {
  return (
    <div>
      <h2>Total Hours: {totalHours}</h2>
      <h2>Total Earnings: £{totalEarnings.toFixed(2)}</h2>
      <ul>
        {shifts.map((shift) => (
          <li key={shift.id}>
            {shift.date} | {shift.startTime} - {shift.endTime} | £{shift.hourlyRate}/hr
            <button onClick={() => onEdit(shift)}>✏️ Edit</button>
            <button onClick={() => onDelete(shift.id)}>❌ Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
