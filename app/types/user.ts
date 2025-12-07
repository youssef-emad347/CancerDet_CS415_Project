export type UserRole = 'doctor' | 'patient';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  createdAt: number; // Timestamp
}

export interface PatientProfile extends UserProfile {
  role: 'patient';
  medicalHistory?: string[];
  dateOfBirth?: string;
  primaryPhysicianId?: string;
  doctorId?: string; // Explicitly requested field
}

export interface DoctorProfile extends UserProfile {
  role: 'doctor';
  specialty: string;
  licenseNumber: string;
  hospitalAffiliation?: string;
  isVerified?: boolean; // For verification status
  doctorCode: string; // Unique simple ID for patients to add
}
