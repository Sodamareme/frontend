export interface LearnerFormSubmitData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    gender: 'MALE' | 'FEMALE';
    birthDate: string;
    birthPlace: string;
    promotionId: string;
    refId: string;
    status: 'ACTIVE' | 'WAITING';
    photoFile?: File;
    tutor: {
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
      address: string;
    };
  }