/**
 * Données fictives pour les étudiants et programmes
 */

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  program: string;
  email?: string;
  phone?: string;
  isActive: boolean;
}

export interface ScanResult {
  id: string;
  student: Student;
  scanTime: Date;
  mealType: 'BREAKFAST' | 'LUNCH';
  location?: string;
  operator?: string;
}

// Liste des programmes disponibles
const PROGRAMS = [
  'Informatique',
  'Génie Civil',
  'Génie Électrique',
  'Génie Mécanique',
  'Administration des Affaires',
  'Comptabilité',
  'Marketing',
  'Ressources Humaines',
  'Droit',
  'Médecine',
  'Pharmacie',
  'Psychologie',
  'Éducation',
  'Sciences Sociales',
  'Mathématiques',
  'Physique',
  'Chimie',
  'Biologie'
];

// Données fictives des étudiants
const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    firstName: 'Amadou',
    lastName: 'Diallo',
    studentNumber: 'ETU001',
    program: 'Informatique',
    email: 'amadou.diallo@universite.sn',
    isActive: true
  },
  {
    id: '2',
    firstName: 'Fatou',
    lastName: 'Sow',
    studentNumber: 'ETU002',
    program: 'Génie Civil',
    email: 'fatou.sow@universite.sn',
    isActive: true
  },
  {
    id: '3',
    firstName: 'Moussa',
    lastName: 'Ba',
    studentNumber: 'ETU003',
    program: 'Administration des Affaires',
    email: 'moussa.ba@universite.sn',
    isActive: true
  },
  {
    id: '4',
    firstName: 'Aïssatou',
    lastName: 'Ndiaye',
    studentNumber: 'ETU004',
    program: 'Médecine',
    email: 'aissatou.ndiaye@universite.sn',
    isActive: true
  },
  {
    id: '5',
    firstName: 'Ibrahima',
    lastName: 'Fall',
    studentNumber: 'ETU005',
    program: 'Droit',
    email: 'ibrahima.fall@universite.sn',
    isActive: true
  },
  {
    id: '6',
    firstName: 'Mariama',
    lastName: 'Traoré',
    studentNumber: 'ETU006',
    program: 'Psychologie',
    email: 'mariama.traore@universite.sn',
    isActive: true
  },
  {
    id: '7',
    firstName: 'Ousmane',
    lastName: 'Cissé',
    studentNumber: 'ETU007',
    program: 'Génie Électrique',
    email: 'ousmane.cisse@universite.sn',
    isActive: true
  },
  {
    id: '8',
    firstName: 'Khady',
    lastName: 'Diop',
    studentNumber: 'ETU008',
    program: 'Comptabilité',
    email: 'khady.diop@universite.sn',
    isActive: true
  },
  {
    id: '9',
    firstName: 'Mamadou',
    lastName: 'Gueye',
    studentNumber: 'ETU009',
    program: 'Génie Mécanique',
    email: 'mamadou.gueye@universite.sn',
    isActive: true
  },
  {
    id: '10',
    firstName: 'Astou',
    lastName: 'Sarr',
    studentNumber: 'ETU010',
    program: 'Marketing',
    email: 'astou.sarr@universite.sn',
    isActive: true
  }
];

/**
 * Récupère tous les programmes disponibles
 */
export function getAllPrograms(): string[] {
  return [...PROGRAMS];
}

/**
 * Récupère tous les étudiants
 */
export function getAllStudents(): Student[] {
  return [...MOCK_STUDENTS];
}

/**
 * Récupère un étudiant par son ID
 */
export function getStudentById(id: string): Student | undefined {
  return MOCK_STUDENTS.find(student => student.id === id);
}

/**
 * Récupère un étudiant par son numéro d'étudiant
 */
export function getStudentByNumber(studentNumber: string): Student | undefined {
  return MOCK_STUDENTS.find(student => student.studentNumber === studentNumber);
}

/**
 * Recherche des étudiants par nom, prénom ou numéro
 */
export function searchStudents(query: string): Student[] {
  const lowerQuery = query.toLowerCase();
  return MOCK_STUDENTS.filter(student => 
    student.firstName.toLowerCase().includes(lowerQuery) ||
    student.lastName.toLowerCase().includes(lowerQuery) ||
    student.studentNumber.toLowerCase().includes(lowerQuery) ||
    student.program.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Récupère les étudiants par programme
 */
export function getStudentsByProgram(program: string): Student[] {
  return MOCK_STUDENTS.filter(student => student.program === program);
}

/**
 * Génère des résultats de scan fictifs pour les tests
 */
export function generateMockScanResults(count: number = 50): ScanResult[] {
  const results: ScanResult[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const student = MOCK_STUDENTS[Math.floor(Math.random() * MOCK_STUDENTS.length)];
    const daysAgo = Math.floor(Math.random() * 30); // 30 derniers jours
    const scanDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    // Générer une heure réaliste selon le type de repas
    const mealType = Math.random() < 0.5 ? 'BREAKFAST' : 'LUNCH';
    if (mealType === 'BREAKFAST') {
      scanDate.setHours(7 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
    } else {
      scanDate.setHours(11 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60));
    }
    
    results.push({
      id: `scan_${i + 1}`,
      student: { ...student },
      scanTime: scanDate,
      mealType,
      location: 'Cafétéria Principale',
      operator: 'Système'
    });
  }
  
  return results.sort((a, b) => b.scanTime.getTime() - a.scanTime.getTime());
}