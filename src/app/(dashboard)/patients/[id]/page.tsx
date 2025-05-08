import { PatientDetail } from '@/components/patients/PatientDetail';

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto p-6">
      <PatientDetail patientId={params.id} />
    </div>
  );
} 