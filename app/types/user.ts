export type UserRole = 'doctor' | 'patient';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  createdAt: number; // Timestamp
  stats?: {
      patientCount: number;
      pendingReports: number;
  };
  linkedDoctorId?: string; // For patients linked to a doctor
}

export interface PatientProfile extends UserProfile {
  role: 'patient';
  medicalHistory?: string[];
  dateOfBirth?: string;
  primaryPhysicianId?: string; // Legacy/Alt
  healthScore?: number;
  nextVisit?: string;
}

export interface DoctorProfile extends UserProfile {
  role: 'doctor';
  specialty: string;
  licenseNumber: string;
  hospitalAffiliation?: string;
  isVerified?: boolean; // For verification status
  doctorCode: string; // Unique simple ID for patients to add
}
