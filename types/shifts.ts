// types/shifts.ts

// What the server RETURNS (DTO)
export interface ShiftDto {
  id: number;
  date: string;               // "YYYY-MM-DD"
  startTime: string;          // "HH:mm:ss"
  endTime: string;            // "HH:mm:ss"
  hourlyRate: number | null;  // per-shift override; null => use monthly default
  effectiveHourlyRate: number;
  isCompleted: boolean;
  totalHours: number;
  pay: number;
}

export interface ShiftsResponse {
  shifts: ShiftDto[];
  totalHours: number;
  totalPay: number;
  monthlyDefaultRate: number;
}

// What you POST/PUT to the server
export interface ShiftInput {
  id?: number;                // required for PUT
  date: string;               // "YYYY-MM-DDT00:00:00"
  startTime: string;          // "HH:mm:ss"
  endTime: string;            // "HH:mm:ss"
  hourlyRate: number | null;  // null => use monthly default
  isCompleted?: boolean;
}
