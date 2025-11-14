// types/Student.ts

/**
 * Type de repas
 */
export type MealType = 'BREAKFAST' | 'LUNCH';

/**
 * Statut de l'apprenant
 */
export type LearnerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

/**
 * Genre
 */
export type Gender = 'MALE' | 'FEMALE';

/**
 * Interface pour les informations d'un étudiant/apprenant
 */
export interface Student {
  studentNumber: string;      // Matricule (ex: "ODC-DSD25307")
  firstName: string;           // Prénom
  lastName: string;            // Nom
  program: string;             // Programme/Formation
  qrCode: string;              // URL du QR code
  photoUrl?: string;           // URL de la photo (optionnel)
  address?: string;            // Adresse (optionnel)
  gender?: Gender;             // Genre (optionnel)
  birthDate?: string | Date;   // Date de naissance (optionnel)
  birthPlace?: string;         // Lieu de naissance (optionnel)
  phone?: string;              // Téléphone (optionnel)
  status?: LearnerStatus;      // Statut (optionnel)
}

/**
 * Interface pour le résultat d'un scan
 */
export interface ScanResult {
  student: Student;            // Informations de l'étudiant scanné
  scanTime: Date;              // Date et heure du scan
  mealType: MealType;          // Type de repas (petit-déjeuner ou déjeuner)
}

/**
 * Interface pour la réponse de l'API backend
 */
export interface ApiScanResponse {
  id: string;
  date: string;
  type: string;
  learnerId: string;
  createdAt: string;
  updatedAt: string;
  learner: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
    address: string;
    gender: Gender;
    birthDate: string;
    birthPlace: string;
    phone: string;
    photoUrl: string;
    status: LearnerStatus;
    qrCode: string;
    userId: string;
    refId: string;
    promotionId: string;
    createdAt: string;
    updatedAt: string;
    sessionId: string | null;
  };
}

/**
 * Interface pour les statistiques des scans
 */
export interface ScanStats {
  totalScans: number;
  breakfastCount: number;
  lunchCount: number;
  todayScans: number;
  uniqueStudents: number;
}

/**
 * Interface pour les filtres de recherche
 */
export interface ScanFilter {
  dateFrom?: Date;
  dateTo?: Date;
  mealType?: MealType;
  studentNumber?: string;
  searchTerm?: string;
}

/**
 * Interface pour la réponse paginée de l'API
 */
export interface PaginatedScanResponse {
  data: ApiScanResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Type pour les erreurs de scan
 */
export interface ScanError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Utilitaire : Convertir ApiScanResponse en ScanResult
 */
export function apiToScanResult(apiData: ApiScanResponse): ScanResult {
  return {
    student: {
      studentNumber: apiData.learner.matricule,
      firstName: apiData.learner.firstName,
      lastName: apiData.learner.lastName,
      program: '', // À compléter si disponible dans l'API
      qrCode: apiData.learner.qrCode,
      photoUrl: apiData.learner.photoUrl,
      address: apiData.learner.address,
      gender: apiData.learner.gender,
      birthDate: apiData.learner.birthDate,
      birthPlace: apiData.learner.birthPlace,
      phone: apiData.learner.phone,
      status: apiData.learner.status
    },
    scanTime: new Date(apiData.createdAt),
    mealType: apiData.type === 'petit-dejeuner' ? 'BREAKFAST' : 'LUNCH'
  };
}

/**
 * Utilitaire : Convertir un tableau d'ApiScanResponse en ScanResult[]
 */
export function apiArrayToScanResults(apiData: ApiScanResponse[]): ScanResult[] {
  return apiData.map(apiToScanResult);
}

/**
 * Utilitaire : Vérifier si un scan est aujourd'hui
 */
export function isScanToday(scan: ScanResult): boolean {
  const today = new Date();
  const scanDate = scan.scanTime;
  
  return (
    scanDate.getDate() === today.getDate() &&
    scanDate.getMonth() === today.getMonth() &&
    scanDate.getFullYear() === today.getFullYear()
  );
}

/**
 * Utilitaire : Filtrer les scans selon des critères
 */
export function filterScans(scans: ScanResult[], filter: ScanFilter): ScanResult[] {
  return scans.filter(scan => {
    // Filtre par date de début
    if (filter.dateFrom && scan.scanTime < filter.dateFrom) {
      return false;
    }
    
    // Filtre par date de fin
    if (filter.dateTo && scan.scanTime > filter.dateTo) {
      return false;
    }
    
    // Filtre par type de repas
    if (filter.mealType && scan.mealType !== filter.mealType) {
      return false;
    }
    
    // Filtre par numéro d'étudiant
    if (filter.studentNumber && scan.student.studentNumber !== filter.studentNumber) {
      return false;
    }
    
    // Filtre par terme de recherche (nom, prénom, matricule)
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      const fullName = `${scan.student.firstName} ${scan.student.lastName}`.toLowerCase();
      const studentNumber = scan.student.studentNumber.toLowerCase();
      
      if (!fullName.includes(term) && !studentNumber.includes(term)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Utilitaire : Calculer les statistiques des scans
 */
export function calculateScanStats(scans: ScanResult[]): ScanStats {
  const todayScans = scans.filter(isScanToday);
  const uniqueStudents = new Set(scans.map(scan => scan.student.studentNumber));
  
  return {
    totalScans: scans.length,
    breakfastCount: scans.filter(scan => scan.mealType === 'BREAKFAST').length,
    lunchCount: scans.filter(scan => scan.mealType === 'LUNCH').length,
    todayScans: todayScans.length,
    uniqueStudents: uniqueStudents.size
  };
}

/**
 * Utilitaire : Trier les scans (plus récent en premier par défaut)
 */
export function sortScans(scans: ScanResult[], descending: boolean = true): ScanResult[] {
  return [...scans].sort((a, b) => {
    const diff = b.scanTime.getTime() - a.scanTime.getTime();
    return descending ? diff : -diff;
  });
}

/**
 * Utilitaire : Grouper les scans par date
 */
export function groupScansByDate(scans: ScanResult[]): Map<string, ScanResult[]> {
  const grouped = new Map<string, ScanResult[]>();
  
  scans.forEach(scan => {
    const dateKey = scan.scanTime.toLocaleDateString('fr-FR');
    
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    
    grouped.get(dateKey)!.push(scan);
  });
  
  return grouped;
}

/**
 * Utilitaire : Formater l'affichage d'un scan
 */
export function formatScanDisplay(scan: ScanResult): string {
  const time = scan.scanTime.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  const mealLabel = scan.mealType === 'BREAKFAST' ? 'Petit-déjeuner' : 'Déjeuner';
  
  return `${scan.student.firstName} ${scan.student.lastName} - ${mealLabel} à ${time}`;
}