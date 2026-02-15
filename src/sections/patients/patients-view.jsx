import { Helmet } from 'react-helmet-async';

import { Container } from '@mui/material';

import { usePathname } from 'src/routes/hooks';

import PatientQueueView from './patient-queue/patient-queue-view';
import PatientAccueilView from './patient-accueil/patient-accueil-view';
import PatientHistoryView from './patient-history/patient-history-view';
// Import des vues
import PatientDossiersView from './patient-dossiers/patient-dossiers-view';
import PatientDocumentsView from './patient-documents/patient-documents-view';
import PatientAntecedentsView from './patient-antecedents/patient-antecedents-view';
import PatientAppointmentsView from './patient-appointments/patient-appointments-view';
import PatientConsultationsView from './patient-consultations/patient-consultations-view';
import PatientConsultationCreateView from './patient-consultation-create/patient-consultation-create-view';

// ----------------------------------------------------------------------

export default function PatientsView() {
  const pathname = usePathname();

  // Déterminer quelle vue afficher selon la route
  const renderContent = () => {
    // Vérifier les routes les plus spécifiques en premier
    // IMPORTANT: Vérifier /patients/consultation/create/ AVANT /patients/consultations
    if (pathname.includes('/patients/consultation/create/')) {
      return <PatientConsultationCreateView />;
    }
    if (pathname.includes('/patients/accueil')) {
      return <PatientAccueilView />;
    }
    if (pathname.includes('/patients/history')) {
      return <PatientHistoryView />;
    }
    if (pathname.includes('/patients/antecedents')) {
      return <PatientAntecedentsView />;
    }
    if (pathname.includes('/patients/documents')) {
      return <PatientDocumentsView />;
    }
    if (pathname.includes('/patients/consultations') && !pathname.includes('/patients/consultation/create/')) {
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
    
    // Par défaut (pour /patients), afficher la vue d'accueil
    if (pathname === '/patients' || pathname.startsWith('/patients')) {
      return <PatientAccueilView />;
    }
    
    return <PatientAccueilView />;
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
