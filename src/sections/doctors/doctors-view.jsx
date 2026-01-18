import { Helmet } from 'react-helmet-async';

import { Container } from '@mui/material';

import { usePathname } from 'src/routes/hooks';

// Import des vues
import DoctorViewDossiersView from './doctor-view-dossiers/doctor-view-dossiers-view';
import DoctorCreateConsultationView from './doctor-create-consultation/doctor-create-consultation-view';
import DoctorDiagnosticView from './doctor-diagnostic/doctor-diagnostic-view';
import DoctorPrescriptionsView from './doctor-prescriptions/doctor-prescriptions-view';
import DoctorOrdonnancesView from './doctor-ordonnances/doctor-ordonnances-view';
import DoctorHospitalisationView from './doctor-hospitalisation/doctor-hospitalisation-view';
import DoctorCertificatsView from './doctor-certificats/doctor-certificats-view';
import DoctorMessagerieView from './doctor-messagerie/doctor-messagerie-view';

// ----------------------------------------------------------------------

export default function DoctorsView() {
  const pathname = usePathname();

  // Déterminer quelle vue afficher selon la route
  const renderContent = () => {
    // Vérifier les routes les plus spécifiques en premier
    if (pathname.includes('/doctors/view-dossiers')) {
      return <DoctorViewDossiersView />;
    }
    if (pathname.includes('/doctors/create-consultation')) {
      return <DoctorCreateConsultationView />;
    }
    if (pathname.includes('/doctors/diagnostic')) {
      return <DoctorDiagnosticView />;
    }
    if (pathname.includes('/doctors/prescriptions')) {
      return <DoctorPrescriptionsView />;
    }
    if (pathname.includes('/doctors/ordonnances')) {
      return <DoctorOrdonnancesView />;
    }
    if (pathname.includes('/doctors/hospitalisation')) {
      return <DoctorHospitalisationView />;
    }
    if (pathname.includes('/doctors/certificats')) {
      return <DoctorCertificatsView />;
    }
    if (pathname.includes('/doctors/messagerie')) {
      return <DoctorMessagerieView />;
    }
    
    // Par défaut (pour /doctors), afficher la vue des dossiers
    if (pathname === '/doctors' || pathname.startsWith('/doctors')) {
      return <DoctorViewDossiersView />;
    }
    
    return <DoctorViewDossiersView />;
  };

  return (
    <>
      <Helmet>
        <title> Médecins | Clinique </title>
      </Helmet>

      <Container maxWidth="xl">
        {renderContent()}
      </Container>
    </>
  );
}
