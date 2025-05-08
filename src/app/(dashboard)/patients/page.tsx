import { PatientList } from '@/components/patients/PatientList';

export default function PatientsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-2xl font-semibold">Patients</h1>
      <PatientList />
    </div>
  );
} 