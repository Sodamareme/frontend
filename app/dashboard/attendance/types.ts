import { LearnerAttendance } from "@/lib/api";

export type DateFilterType = 'day' | 'week' | 'month' | 'year' | 'total';

export interface AttendanceStats {
  present: number;
  late: number;
  absent: number;
  total: number;
}

export const DATE_FILTER_OPTIONS = [
  { value: 'day', label: 'Journalier' },
  { value: 'week', label: 'Hebdomadaire' },
  { value: 'month', label: 'Mensuel' },
  { value: 'year', label: 'Annuel' },
  { value: 'total', label: 'Total' }
] as const;

export interface JustificationStatus {
  PENDING: 'PENDING';
  ACCEPTED: 'ACCEPTED';
  REJECTED: 'REJECTED';
}

export interface AttendanceRecord {
  id: string;
  learnerId: string;
  date: string;
  scanTime?: string;
  isPresent: boolean;
  isLate: boolean;
  status?: keyof JustificationStatus;
  justification?: string;
  documentUrl?: string;
  justificationComment?: string;
}

export interface AttendanceFilters {
  date: string;
  type: DateFilterType;
  status?: string;
  search?: string;
}