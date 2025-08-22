// utils/time.ts
import { Shift } from "../types/shifts";

// Calculate hours for a shift
export function calculateHoursForShift(shift: Shift): number {
  const start = new Date(`1970-01-01T${shift.startTime}`);
  const end = new Date(`1970-01-01T${shift.endTime}`);
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

// Calculate total earnings for an array of shifts
export function calculateEarnings(shifts: Shift[]): number {
  return shifts.reduce((sum, s) => sum + calculateHoursForShift(s) * s.hourlyRate, 0);
}
