import { Learner, Tutor, ImportResult, ImportResponse, ValidationError } from '../../lib/types/import';
import { BulkCreateLearnerDto, BulkImportResponseDto, LearnerImportResultDto } from 'lib/types/bulk-import';

class ImportService {
  // Simulation des données existantes - en production, ces données viendraient de la base
  private existingEmails = new Set(['john@example.com', 'jane@example.com']);
  private existingPhones = new Set(['+1234567890', '+0987654321']);
  private validPromotions = new Set(['PROMO2024A', 'PROMO2024B', 'PROMO2023A']);
  private validReferentials = new Set(['REF001', 'REF002', 'REF003']);
  private validSessions = new Set(['SESSION001', 'SESSION002', 'SESSION003']);

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  private validateRequired(value: any, fieldName: string): ValidationError | null {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return {
        field: fieldName,
        message: `${fieldName} est requis`,
        value
      };
    }
    return null;
  }

  private validateBulkLearner(learner: BulkCreateLearnerDto, index: number): ValidationError[] {
    const errors: ValidationError[] = [];
    const prefix = `Ligne ${index + 2}:`; // +2 car ligne 1 = headers, index commence à 0

    // Validation des champs requis
    const requiredFields = [
      { field: 'firstName', label: 'Prénom' },
      { field: 'lastName', label: 'Nom' },
      { field: 'email', label: 'Email' },
      { field: 'phone', label: 'Téléphone' },
      { field: 'address', label: 'Adresse' },
      { field: 'birthDate', label: 'Date de naissance' },
      { field: 'birthPlace', label: 'Lieu de naissance' },
      { field: 'promotionId', label: 'ID Promotion' },
      { field: 'tutorFirstName', label: 'Prénom tuteur' },
      { field: 'tutorLastName', label: 'Nom tuteur' },
      { field: 'tutorPhone', label: 'Téléphone tuteur' },
      { field: 'tutorAddress', label: 'Adresse tuteur' }
    ];

    requiredFields.forEach(({ field, label }) => {
      const error = this.validateRequired(learner[field as keyof BulkCreateLearnerDto], label);
      if (error) {
        errors.push({
          ...error,
          message: `${prefix} ${error.message}`
        });
      }
    });

    // Validation email
    if (learner.email && !this.validateEmail(learner.email)) {
      errors.push({
        field: 'email',
        message: `${prefix} Format d'email invalide`,
        value: learner.email
      });
    }

    // Validation téléphone
    if (learner.phone && !this.validatePhone(learner.phone)) {
      errors.push({
        field: 'phone',
        message: `${prefix} Format de téléphone invalide`,
        value: learner.phone
      });
    }

    // Validation genre
    if (learner.gender && !['MALE', 'FEMALE', 'OTHER'].includes(learner.gender)) {
      errors.push({
        field: 'gender',
        message: `${prefix} Genre invalide (MALE, FEMALE, OTHER attendu)`,
        value: learner.gender
      });
    }

    // Validation date de naissance
    if (learner.birthDate && !this.validateDate(learner.birthDate)) {
      errors.push({
        field: 'birthDate',
        message: `${prefix} Date de naissance invalide`,
        value: learner.birthDate
      });
    }

    // Validation promotion
    if (learner.promotionId && !this.validPromotions.has(learner.promotionId)) {
      errors.push({
        field: 'promotionId',
        message: `${prefix} ID de promotion invalide ou inexistant`,
        value: learner.promotionId
      });
    }

    // Validation référentiel (optionnel)
    if (learner.refId && !this.validReferentials.has(learner.refId)) {
      errors.push({
        field: 'refId',
        message: `${prefix} ID de référentiel invalide`,
        value: learner.refId
      });
    }

    // Validation session (optionnel)
    if (learner.sessionId && !this.validSessions.has(learner.sessionId)) {
      errors.push({
        field: 'sessionId',
        message: `${prefix} ID de session invalide`,
        value: learner.sessionId
      });
    }

    // Validation email tuteur (optionnel)
    if (learner.tutorEmail && !this.validateEmail(learner.tutorEmail)) {
      errors.push({
        field: 'tutorEmail',
        message: `${prefix} Format d'email du tuteur invalide`,
        value: learner.tutorEmail
      });
    }

    // Validation téléphone tuteur
    if (learner.tutorPhone && !this.validatePhone(learner.tutorPhone)) {
      errors.push({
        field: 'tutorPhone',
        message: `${prefix} Format de téléphone du tuteur invalide`,
        value: learner.tutorPhone
      });
    }

    return errors;
  }

  async processBulkLearners(learners: BulkCreateLearnerDto[]): Promise<BulkImportResponseDto> {
    const results: LearnerImportResultDto[] = [];
    let successCount = 0;
    let failCount = 0;
    const processedEmails = new Set<string>();
    const processedPhones = new Set<string>();

    // Simulation du délai de traitement
    await new Promise(resolve => setTimeout(resolve, 2000));

    for (let i = 0; i < learners.length; i++) {
      const learner = learners[i];
      const validationErrors = this.validateBulkLearner(learner, i);
      const warnings: string[] = [];

      // Vérification des doublons dans le lot actuel
      if (processedEmails.has(learner.email)) {
        validationErrors.push({
          field: 'email',
          message: `Ligne ${i + 2}: Email dupliqué dans le fichier`,
          value: learner.email
        });
      }

      if (processedPhones.has(learner.phone)) {
        validationErrors.push({
          field: 'phone',
          message: `Ligne ${i + 2}: Téléphone dupliqué dans le fichier`,
          value: learner.phone
        });
      }

      // Vérification des doublons avec les données existantes
      if (this.existingEmails.has(learner.email)) {
        validationErrors.push({
          field: 'email',
          message: `Ligne ${i + 2}: Email déjà existant en base`,
          value: learner.email
        });
      }

      if (this.existingPhones.has(learner.phone)) {
        validationErrors.push({
          field: 'phone',
          message: `Ligne ${i + 2}: Téléphone déjà existant en base`,
          value: learner.phone
        });
      }

      if (validationErrors.length > 0) {
        results.push({
          success: false,
          email: learner.email || 'N/A',
          firstName: learner.firstName,
          lastName: learner.lastName,
          error: `${validationErrors.length} erreur(s) de validation`,
          validationErrors
        });
        failCount++;
      } else {
        // Avertissements pour capacité de session
        if (learner.sessionId && Math.random() > 0.7) {
          warnings.push('Capacité de session bientôt atteinte');
        }

        // Génération du matricule et ID
        const matricule = this.generateMatricule();
        const learnerId = `learner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        results.push({
          success: true,
          email: learner.email,
          firstName: learner.firstName,
          lastName: learner.lastName,
          learnerId,
          matricule,
          warnings: warnings.length > 0 ? warnings : undefined
        });

        // Ajouter aux sets pour éviter les doublons dans le même lot
        processedEmails.add(learner.email);
        processedPhones.add(learner.phone);
        this.existingEmails.add(learner.email);
        this.existingPhones.add(learner.phone);

        successCount++;
      }
    }

    // Calcul des statistiques
    const duplicateEmails = results.filter(r => 
      r.validationErrors?.some(e => e.message.includes('Email') && e.message.includes('dupliqué'))
    ).length;

    const duplicatePhones = results.filter(r => 
      r.validationErrors?.some(e => e.message.includes('Téléphone') && e.message.includes('dupliqué'))
    ).length;

    const missingReferentials = results.filter(r => 
      r.validationErrors?.some(e => e.field === 'promotionId' || e.field === 'refId')
    ).length;

    return {
      totalProcessed: learners.length,
      successfulImports: successCount,
      failedImports: failCount,
      results,
      summary: {
        duplicateEmails,
        duplicatePhones,
        sessionCapacityWarnings: results.filter(r => 
          r.warnings?.some(w => w.includes('Capacité'))
        ).length,
        missingReferentials,
        invalidData: failCount
      }
    };
  }

  parseBulkCSV(csvContent: string): BulkCreateLearnerDto[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('Le fichier CSV doit contenir au moins une ligne d\'en-têtes et une ligne de données');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const learners: BulkCreateLearnerDto[] = [];
    
    // Mapping des en-têtes attendus
    const expectedHeaders = {
      'firstName': ['firstName', 'prenom', 'prénom', 'first_name'],
      'lastName': ['lastName', 'nom', 'last_name'],
      'email': ['email', 'mail', 'e-mail'],
      'phone': ['phone', 'telephone', 'téléphone', 'tel'],
      'address': ['address', 'adresse'],
      'gender': ['gender', 'genre', 'sexe'],
      'birthDate': ['birthDate', 'dateNaissance', 'date_naissance', 'birth_date'],
      'birthPlace': ['birthPlace', 'lieuNaissance', 'lieu_naissance', 'birth_place'],
      'promotionId': ['promotionId', 'promotion', 'promotion_id'],
      'refId': ['refId', 'referentiel', 'referential', 'ref_id'],
      'sessionId': ['sessionId', 'session', 'session_id'],
      'status': ['status', 'statut'],
      'tutorFirstName': ['tutorFirstName', 'prenomTuteur', 'prenom_tuteur', 'tutor_first_name'],
      'tutorLastName': ['tutorLastName', 'nomTuteur', 'nom_tuteur', 'tutor_last_name'],
      'tutorPhone': ['tutorPhone', 'telephoneTuteur', 'telephone_tuteur', 'tutor_phone'],
      'tutorAddress': ['tutorAddress', 'adresseTuteur', 'adresse_tuteur', 'tutor_address'],
      'tutorEmail': ['tutorEmail', 'emailTuteur', 'email_tuteur', 'tutor_email']
    };

    // Créer un mapping des index de colonnes
    const columnMapping: { [key: string]: number } = {};
    
    Object.entries(expectedHeaders).forEach(([field, possibleNames]) => {
      const headerIndex = headers.findIndex(header => 
        possibleNames.some(name => 
          header.toLowerCase() === name.toLowerCase()
        )
      );
      if (headerIndex !== -1) {
        columnMapping[field] = headerIndex;
      }
    });
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      // Ignorer les lignes vides
      if (values.every(v => !v)) continue;
      
      const learner: Partial<BulkCreateLearnerDto> = {};
      
      // Mapper les valeurs selon le mapping des colonnes
      Object.entries(columnMapping).forEach(([field, index]) => {
        const value = values[index]?.trim();
        if (value) {
          (learner as any)[field] = value;
        }
      });
      
      // Validation et conversion des types
      if (learner.gender) {
        learner.gender = learner.gender.toUpperCase() as any;
      }
      
      learners.push(learner as BulkCreateLearnerDto);
    }
    
    return learners;
  }

  generateBulkSampleCSV(): string {
    const headers = [
      'firstName', 'lastName', 'email', 'phone', 'address', 'gender',
      'birthDate', 'birthPlace', 'promotionId', 'refId', 'sessionId',
      'tutorFirstName', 'tutorLastName', 'tutorPhone', 'tutorAddress', 'tutorEmail'
    ];
    
    const sampleData = [
      [
        'Marie', 'Dupont', 'marie.dupont@email.com', '+33123456789', 
        '123 Rue de la Paix, Paris', 'FEMALE', '2000-05-15', 'Paris',
        'PROMO2024A', 'REF001', 'SESSION001', 'Jean', 'Dupont', '+33987654321', 
        '123 Rue de la Paix, Paris', 'jean.dupont@email.com'
      ],
      [
        'Pierre', 'Martin', 'pierre.martin@email.com', '+33234567890',
        '456 Avenue des Champs, Lyon', 'MALE', '1999-12-03', 'Lyon',
        'PROMO2024B', 'REF002', '', 'Claire', 'Martin', '+33876543210',
        '456 Avenue des Champs, Lyon', 'claire.martin@email.com'
      ],
      [
        'Sophie', 'Bernard', 'sophie.bernard@email.com', '+33345678901',
        '789 Boulevard Saint-Germain, Marseille', 'FEMALE', '2001-08-22', 'Marseille',
        'PROMO2024A', '', '', 'Michel', 'Bernard', '+33765432109',
        '789 Boulevard Saint-Germain, Marseille', ''
      ]
    ];
    
    return [headers.join(','), ...sampleData.map(row => row.join(','))].join('\n');
  }
  private validateDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date < new Date();
  }

  private validateLearner(learner: Learner): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!learner.firstName?.trim()) {
      errors.push({
        field: 'firstName',
        message: 'Le prénom est requis',
        value: learner.firstName
      });
    }

    if (!learner.lastName?.trim()) {
      errors.push({
        field: 'lastName',
        message: 'Le nom est requis',
        value: learner.lastName
      });
    }

    if (!learner.email?.trim()) {
      errors.push({
        field: 'email',
        message: 'L\'email est requis',
        value: learner.email
      });
    } else if (!this.validateEmail(learner.email)) {
      errors.push({
        field: 'email',
        message: 'Format d\'email invalide',
        value: learner.email
      });
    } else if (this.existingEmails.has(learner.email)) {
      errors.push({
        field: 'email',
        message: 'Email déjà existant',
        value: learner.email
      });
    }

    if (!learner.phone?.trim()) {
      errors.push({
        field: 'phone',
        message: 'Le téléphone est requis',
        value: learner.phone
      });
    } else if (!this.validatePhone(learner.phone)) {
      errors.push({
        field: 'phone',
        message: 'Format de téléphone invalide',
        value: learner.phone
      });
    } else if (this.existingPhones.has(learner.phone)) {
      errors.push({
        field: 'phone',
        message: 'Numéro de téléphone déjà existant',
        value: learner.phone
      });
    }

    if (!learner.gender || !['MALE', 'FEMALE', 'OTHER'].includes(learner.gender)) {
      errors.push({
        field: 'gender',
        message: 'Genre invalide (MALE, FEMALE, OTHER)',
        value: learner.gender
      });
    }

    if (!learner.birthDate || !this.validateDate(learner.birthDate)) {
      errors.push({
        field: 'birthDate',
        message: 'Date de naissance invalide',
        value: learner.birthDate
      });
    }

    if (!learner.promotionId || !this.validPromotions.has(learner.promotionId)) {
      errors.push({
        field: 'promotionId',
        message: 'ID de promotion invalide ou inexistant',
        value: learner.promotionId
      });
    }

    if (!learner.tutorFirstName?.trim()) {
      errors.push({
        field: 'tutorFirstName',
        message: 'Le prénom du tuteur est requis',
        value: learner.tutorFirstName
      });
    }

    if (!learner.tutorLastName?.trim()) {
      errors.push({
        field: 'tutorLastName',
        message: 'Le nom du tuteur est requis',
        value: learner.tutorLastName
      });
    }

    if (!learner.tutorPhone?.trim()) {
      errors.push({
        field: 'tutorPhone',
        message: 'Le téléphone du tuteur est requis',
        value: learner.tutorPhone
      });
    } else if (!this.validatePhone(learner.tutorPhone)) {
      errors.push({
        field: 'tutorPhone',
        message: 'Format de téléphone du tuteur invalide',
        value: learner.tutorPhone
      });
    }

    if (learner.tutorEmail && !this.validateEmail(learner.tutorEmail)) {
      errors.push({
        field: 'tutorEmail',
        message: 'Format d\'email du tuteur invalide',
        value: learner.tutorEmail
      });
    }

    return errors;
  }

  private generateMatricule(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${year}${random}`;
  }

  async processLearners(learners: Learner[]): Promise<ImportResponse> {
    const results: ImportResult[] = [];
    let successCount = 0;
    let failCount = 0;

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    for (const learner of learners) {
      const validationErrors = this.validateLearner(learner);
      const warnings: string[] = [];

      if (validationErrors.length > 0) {
        results.push({
          success: false,
          email: learner.email || 'N/A',
          firstName: learner.firstName,
          lastName: learner.lastName,
          error: `${validationErrors.length} erreur(s) de validation`,
          validationErrors
        });
        failCount++;
      } else {
        // Check for warnings
        if (learner.sessionId && Math.random() > 0.8) {
          warnings.push('Capacité de session presque atteinte');
        }

        const matricule = this.generateMatricule();
        const learnerId = `learner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        results.push({
          success: true,
          email: learner.email,
          firstName: learner.firstName,
          lastName: learner.lastName,
          learnerId,
          matricule,
          warnings: warnings.length > 0 ? warnings : undefined
        });

        // Add to existing sets to prevent duplicates in the same batch
        this.existingEmails.add(learner.email);
        if (learner.phone) this.existingPhones.add(learner.phone);

        successCount++;
      }
    }

    const duplicateEmails = results.filter(r => 
      r.validationErrors?.some(e => e.field === 'email' && e.message.includes('déjà existant'))
    ).length;

    const duplicatePhones = results.filter(r => 
      r.validationErrors?.some(e => e.field === 'phone' && e.message.includes('déjà existant'))
    ).length;

    return {
      totalProcessed: learners.length,
      successfulImports: successCount,
      failedImports: failCount,
      results,
      summary: {
        duplicateEmails,
        duplicatePhones,
        sessionCapacityWarnings: results.filter(r => r.warnings?.some(w => w.includes('Capacité'))).length,
        missingReferentials: results.filter(r => 
          r.validationErrors?.some(e => e.field === 'promotionId')
        ).length,
        invalidData: failCount
      }
    };
  }

  parseCSV(csvContent: string): Learner[] {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const learners: Learner[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const learner: any = {};
      
      headers.forEach((header, index) => {
        learner[header] = values[index] || '';
      });
      
      learners.push(learner as Learner);
    }
    
    return learners;
  }

  generateSampleCSV(): string {
    const headers = [
      'firstName', 'lastName', 'email', 'phone', 'address', 'gender',
      'birthDate', 'birthPlace', 'promotionId', 'tutorFirstName', 
      'tutorLastName', 'tutorPhone', 'tutorAddress', 'tutorEmail'
    ];
    
    const sampleData = [
      [
        'Marie', 'Dupont', 'marie.dupont@email.com', '+33123456789', 
        '123 Rue de la Paix, Paris', 'FEMALE', '2000-05-15', 'Paris',
        'PROMO2024A', 'Jean', 'Dupont', '+33987654321', 
        '123 Rue de la Paix, Paris', 'jean.dupont@email.com'
      ],
      [
        'Pierre', 'Martin', 'pierre.martin@email.com', '+33234567890',
        '456 Avenue des Champs, Lyon', 'MALE', '1999-12-03', 'Lyon',
        'PROMO2024B', 'Claire', 'Martin', '+33876543210',
        '456 Avenue des Champs, Lyon', 'claire.martin@email.com'
      ]
    ];
    
    return [headers.join(','), ...sampleData.map(row => row.join(','))].join('\n');
  }
}

export const importService = new ImportService();