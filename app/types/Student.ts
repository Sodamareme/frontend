
// Types
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  program: string;
  year: number;
  studentNumber: string;
  photo?: string;
  status: 'active' | 'inactive' | 'graduated';
  enrollmentDate: string;
}

interface ScanResult {
  student: Student;
  scanTime: Date;
  mealType: 'BREAKFAST' | 'LUNCH';
}

