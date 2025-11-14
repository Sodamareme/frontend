export interface StudentType {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
   user:{
  email: string;
  }
 
  matricule:string
  program: string;
  year: number;
  studentNumber: string;
  photo?: string;
  status: 'active' | 'inactive' | 'graduated';
  enrollmentDate: string;
}