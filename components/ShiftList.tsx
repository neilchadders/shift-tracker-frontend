"use client";

import { Shift } from "../types/shifts";
import { calculateHoursForShift } from "../utils/time";

interface ShiftListProps {
  shifts: Shift[];
  totalHours: number;
  totalEarnings: number;
  onDelete: (id: number) => void;
}

export default function ShiftList({ shifts, totalHours, totalEarnings, onDelete }: ShiftListProps) {
  return (
    <div>
      <h2>Total Hours: {totalHours.toFixed(2)}</h2>
      <h2>Total Earnings: £{totalEarnings.toFixed(2)}</h2>
      <ul>
        {shifts.map((shift) => (
          <li key={shift.id}>
            {shift.date} | {shift.startTime} - {shift.endTime} | £{shift.hourlyRate}/hr{" "}
            <button onClick={() => onDelete(shift.id)}>❌ Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
