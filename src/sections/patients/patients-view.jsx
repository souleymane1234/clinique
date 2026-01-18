import { Helmet } from 'react-helmet-async';

import { Container } from '@mui/material';

import { usePathname } from 'src/routes/hooks';

// Import des vues
import PatientDossiersView from './patient-dossiers/patient-dossiers-view';
import PatientHistoryView from './patient-history/patient-history-view';
import PatientAntecedentsView from './patient-antecedents/patient-antecedents-view';
import PatientDocumentsView from './patient-documents/patient-documents-view';
import PatientConsultationsView from './patient-consultations/patient-consultations-view';
import PatientAppointmentsView from './patient-appointments/patient-appointments-view';
import PatientQueueView from './patient-queue/patient-queue-view';

// ----------------------------------------------------------------------

export default function PatientsView() {
  const pathname = usePathname();

  // Déterminer quelle vue afficher selon la route
  const renderContent = () => {
    // Vérifier les routes les plus spécifiques en premier
    if (pathname.includes('/patients/history')) {
      return <PatientHistoryView />;
    }
    if (pathname.includes('/patients/antecedents')) {
      return <PatientAntecedentsView />;
    }
    if (pathname.includes('/patients/documents')) {
      return <PatientDocumentsView />;
    }
    if (pathname.includes('/patients/consultations')) {
      return <PatientConsultationsView />;
    }
    if (pathname.includes('/patients/appointments') || pathname.includes('/patients/rendez-vous')) {
      return <PatientAppointmentsView />;
    }
    if (pathname.includes('/patients/queue') || pathname.includes('/patients/file-attente')) {
      return <PatientQueueView />;
    }
    if (pathname.includes('/patients/dossiers')) {
      return <PatientDossiersView />;
    }
    
    // Par défaut (pour /patients), afficher la vue des dossiers
    if (pathname === '/patients' || pathname.startsWith('/patients')) {
      return <PatientDossiersView />;
    }
    
    return <PatientDossiersView />;
  };

  return (
    <>
      <Helmet>
        <title> Gestion des Patients | Clinique </title>
      </Helmet>

      <Container maxWidth="xl">
        {renderContent()}
      </Container>
    </>
  );
}
