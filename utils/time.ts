import { ShiftDto } from "../types/shifts";

// Safer "HH:mm[:ss]" parser without timezone issues
function secondsFromHHMMSS(hms: string) {
  const [h, m, s] = hms.split(":").map((n) => parseInt(n || "0", 10));
  return h * 3600 + m * 60 + (s || 0);
}

export const calculateHoursForShift = (shift: ShiftDto) => {
  if (typeof shift.totalHours === "number") return shift.totalHours; // server truth
  const start = secondsFromHHMMSS(shift.startTime);
  const end = secondsFromHHMMSS(shift.endTime);
  return (end - start) / 3600;
};

export const calculateEarnings = (shifts: ShiftDto[]) =>
  shifts.reduce((acc, s) => acc + (s.effectiveHourlyRate ?? 0) * calculateHoursForShift(s), 0);
