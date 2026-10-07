import { DOCTOR_ROLE, DOCTOR_ROLE_TITLE } from '@/lib/doctor';

// Перенос возможен между специальностями, но не внутри «врач-проктолог».
export default function DoctorRole({ capitalized = false }) {
  const [primary, secondary] = (capitalized ? DOCTOR_ROLE_TITLE : DOCTOR_ROLE).split(', ');
  return (
    <>
      <span className="doctor-specialty">{primary},</span>{' '}
      <span className="doctor-specialty">{secondary}</span>
    </>
  );
}
