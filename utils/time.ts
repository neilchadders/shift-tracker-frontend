import { Shift } from "../types/shifts";

export const calculateHoursForShift = (shift: Shift) => {
  const start = new Date(`1970-01-01T${shift.startTime}`);
  const end = new Date(`1970-01-01T${shift.endTime}`);
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
};

export const calculateEarnings = (shifts: Shift[]) => {
  return shifts.reduce((acc, shift) => acc + shift.hourlyRate * calculateHoursForShift(shift), 0);
};
