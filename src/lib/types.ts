import { Timestamp } from "firebase/firestore";

export type MedicalDocument = {
    id: string;
    patientId: string;
    documentType: string;
    uploadDate: Timestamp;
    fileUrl: string;
    fileName: string;
};

export type Prescription = MedicalDocument & {
    medication: string;
    dosage?: string;
    frequency?: string;
    prescribedBy?: string;
};

export type ImagingRecord = MedicalDocument & {
    type: 'X-Ray' | 'CT Scan' | 'MRI' | 'Ultrasound';
    bodyPart: string;
    result?: string;
};

export type LabResult = MedicalDocument & {
    testName: string;
    value?: string;
    referenceRange?: string;
};

export type DoctorVisit = MedicalDocument & {
    doctorName: string;
    specialty?: string;
    reason?: string;
};

export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
  notes?: string;
};

export type Doctor = {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  address: string;
  contactNumber: string;
  image: string;
  latitude: number;
  longitude: number;
  reviews: Review[];
};

export type Review = {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
};

export type Case = {
    id: string;
    patientId: string;
    subject: string;
    description: string;
    status: 'open' | 'in-review' | 'closed';
    createdAt: Timestamp;
}
    
