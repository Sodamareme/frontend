export interface CoachAttendance {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  isPresent: boolean;
  isLate: boolean;
  coachId: string;
  createdAt: string;
  updatedAt: string;
  coach?: {
    firstName: string;
    lastName: string;
    matricule: string;
    photoUrl?: string;
  };
}