import { pdf } from '@react-pdf/renderer';
import { Helmet } from 'react-helmet-async';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Table,
  Button,
  Select,
  Dialog,
  Divider,
  MenuItem,
  TableRow,
  Container,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  InputLabel,
  Typography,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  InputAdornment,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import { fDateTime } from 'src/utils/format-time';
import { isBillingInvoicePaid } from 'src/utils/billing-utils';
import { transitionService, closeCurrentPassageOnly } from 'src/utils/time-tracking-client';
import { fetchLaboratoryAnalysesForConsultation } from 'src/utils/consultation-laboratory-analysis';

import ConsumApi from 'src/services_workers/consum_api';
import { AdminStorage } from 'src/storages/admins_storage';

import Iconify from 'src/components/iconify';
import FacturePdfDocument from 'src/components/generator-facture/facture-pdf-template';

// ----------------------------------------------------------------------

const CONSULTATION_TYPES = {
  PREMIERE_CONSULTATION: 'Première consultation',
  CONSULTATION_SUIVI: 'Consultation de suivi',
  URGENCE: 'Urgence',
};

const CONSULTATION_CATEGORIES = {
  CONSULTATION_NORMALE: 'Consultation normale',
  CONTROLE_GRATUIT: 'Controle gratuit',
};

const STATUS_COLORS = {
  PRISE_CONSTANTES: 'secondary',
  EN_ATTENTE: 'warning',
  EN_COURS: 'info',
  TERMINEE: 'success',
  ANNULEE: 'error',
};

const STATUS_LABELS = {
  PRISE_CONSTANTES: 'Prise de constantes (infirmier)',
  EN_ATTENTE: 'En attente médecin',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
};

function consultationAnalysisStatusChipLabel(status) {
  if (status === 'EN_ATTENTE') return 'En attente';
  if (status === 'EN_COURS') return 'En cours';
  if (status === 'TERMINE' || status === 'VALIDE') return 'Terminé';
  return status || '—';
}

function consultationAnalysisStatusChipColor(status) {
  if (status === 'EN_ATTENTE') return 'warning';
  if (status === 'EN_COURS') return 'info';
  if (status === 'TERMINE' || status === 'VALIDE') return 'success';
  return 'default';
}

const pickNamedItems = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        return String(item.name || item.label || item.itemName || '').trim();
      }
      return '';
    })
    .filter(Boolean);

const extractBiologyItemNames = (analysis) => {
  const analyseEntries = Array.isArray(analysis?.analyse) ? analysis.analyse : [];
  const names = [];

  analyseEntries.forEach((entry) => {
    if (!entry || typeof entry !== 'object') return;

    names.push(
      ...pickNamedItems(entry.actes_biologies_items_details),
      ...pickNamedItems(entry.actesBiologiesItems),
      ...pickNamedItems(entry.items),
      ...pickNamedItems(entry.actes_biologies_items)
    );
  });

  names.push(...pickNamedItems(analysis?.actesBiologiesItems), ...pickNamedItems(analysis?.items));

  return Array.from(new Set(names));
};

// ----------------------------------------------------------------------

export default function PatientConsultationCreateView() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const { contextHolder, showSuccess, showError, showApiResponse } = useNotification();

  const admin = AdminStorage.getInfoAdmin();
  const currentRole = ((admin?.role ?? admin?.service) ?? '').toString().toUpperCase().trim();
  const canViewConsultationDetails = currentRole !== 'SECRETAIRE';
  const isInfirmier = currentRole === 'INFIRMIER';

  const [loading, setLoading] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [, setLoadingMedecins] = useState(true);
  const [loadingConsultations, setLoadingConsultations] = useState(false);
  const [patient, setPatient] = useState(null);
  const [medecins, setMedecins] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState({ open: false, loading: false, editing: false });
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [serviceTariffs, setServiceTariffs] = useState([]);
  const [loadingServiceTariffs, setLoadingServiceTariffs] = useState(false);
  const [paymentValidated, setPaymentValidated] = useState(false);
  const [validatingPayment, setValidatingPayment] = useState(false);
  const [serviceInvoice, setServiceInvoice] = useState(null);
  const [paymentDialog, setPaymentDialog] = useState({ open: false });
  const [paymentForm, setPaymentForm] = useState({
    method: 'ESPECES',
    amount: 0,
    insuranceAmount: 0,
    patientAmount: 0,
    reference: '',
    details: '',
  });
  const [invoicePdfLoading, setInvoicePdfLoading] = useState(false);
  const [consultationAnalyses, setConsultationAnalyses] = useState([]);
  const [loadingConsultationAnalyses, setLoadingConsultationAnalyses] = useState(false);
  const [consultationForm, setConsultationForm] = useState({
    patientId: patientId || '',
    type: 'PREMIERE_CONSULTATION',
    category: 'CONSULTATION_NORMALE',
    consultationDate: new Date().toISOString(),
    serviceTariffId: '',
  });
  const [transferDoctorDialog, setTransferDoctorDialog] = useState({ open: false, medecinId: '' });

  useEffect(() => {
    const loadPatient = async () => {
      if (!patientId) {
        showError('Erreur', 'Aucun patient sélectionné');
        navigate('/patients/accueil');
        return;
      }

      setLoadingPatient(true);
      try {
        const result = await ConsumApi.getPatientById(patientId);
        if (result.success) {
          const patientData = result.data?.patient || result.data;
          setPatient(patientData);
          setConsultationForm((prev) => ({ ...prev, patientId }));
        } else {
          showError('Erreur', 'Impossible de charger les informations du patient');
          navigate('/patients/accueil');
        }
      } catch (error) {
        console.error('Error loading patient:', error);
        showError('Erreur', 'Erreur lors du chargement du patient');
        navigate('/patients/accueil');
      } finally {
        setLoadingPatient(false);
      }
    };

    const loadMedecins = async () => {
      setLoadingMedecins(true);
      try {
        // Charger tous les médecins depuis l'API
        const result = await ConsumApi.getMedecins({});
        
        console.log('=== DEBUG MEDECINS ===');
        console.log('Full result:', JSON.stringify(result, null, 2));
        console.log('result.success:', result.success);
        console.log('result.data:', result.data);
        console.log('result.data type:', typeof result.data);
        console.log('result.data is array:', Array.isArray(result.data));
        if (result.data && typeof result.data === 'object') {
          console.log('result.data keys:', Object.keys(result.data));
        }
        console.log('====================');
        
        if (result.success) {
          // L'API retourne directement un tableau dans result.data
          let medecinsList = [];
          
          if (Array.isArray(result.data)) {
            medecinsList = result.data;
            console.log('Using direct array, length:', medecinsList.length);
          } else if (result.data && Array.isArray(result.data.medecins)) {
            medecinsList = result.data.medecins;
            console.log('Using medecins key format, length:', medecinsList.length);
          } else if (result.data && Array.isArray(result.data.data)) {
            // Format paginé
            medecinsList = result.data.data;
            console.log('Using paginated format, length:', medecinsList.length);
          } else if (result.data && typeof result.data === 'object') {
            // Peut-être un objet avec une propriété array
            medecinsList = result.data.medecins || result.data.items || result.data.results || [];
            console.log('Using object format, length:', medecinsList.length);
          }
          
          console.log('Medecins list before filter:', medecinsList.length);
          
          // Filtrer pour ne garder que les médecins actifs
          const activeMedecins = medecinsList.filter((medecin) => {
            const status = String(medecin.status || medecin.etat || '').toUpperCase();
            const isActiveByStatus =
              status === 'ACTIVE' || status === 'ACTIF' || status === 'EN_SERVICE' || status === '';
            const isActiveFlag =
              medecin.isActive === true || medecin.active === true || medecin.is_active === true;
            // Si le backend ne renvoie aucun indicateur, on considère la ligne exploitable.
            const hasNoFlag = medecin.isActive === undefined && medecin.active === undefined && medecin.is_active === undefined;
            return isActiveByStatus || isActiveFlag || hasNoFlag;
          });
          
          console.log('Active medecins:', activeMedecins.length);
          
          // Utiliser les médecins actifs s'il y en a, sinon tous les médecins
          const finalMedecinsList = activeMedecins.length > 0 ? activeMedecins : medecinsList;
          
          console.log('Final medecins list:', finalMedecinsList.length);
          console.log('First medecin:', finalMedecinsList[0]);
          
          setMedecins(finalMedecinsList);
          
          if (finalMedecinsList.length === 0) {
            console.warn('Aucun médecin trouvé dans la base de données');
            showError(
              'Avertissement',
              'Aucun médecin enregistré dans la table medecins. Créez d’abord un médecin côté backend avant de créer une consultation.'
            );
          } else {
            console.log(`Chargé ${finalMedecinsList.length} médecin(s)`);
          }
        } else {
          console.error('Failed to load medecins:', result.message || result.errors);
          showError('Erreur', `Impossible de charger les médecins: ${result.message || 'Erreur inconnue'}`);
          setMedecins([]);
        }
      } catch (error) {
        console.error('Error loading medecins:', error);
        console.error('Error stack:', error.stack);
        showError('Erreur', 'Erreur lors du chargement des médecins. Veuillez réessayer.');
        setMedecins([]);
      } finally {
        setLoadingMedecins(false);
      }
    };

    const loadConsultations = async () => {
      if (!patientId) return;
      
      setLoadingConsultations(true);
      try {
        const result = await ConsumApi.getConsultations({ patientId });
        
        console.log('=== DEBUG CONSULTATIONS ===');
        console.log('Full result:', JSON.stringify(result, null, 2));
        console.log('result.success:', result.success);
        console.log('result.data:', result.data);
        console.log('result.data type:', typeof result.data);
        console.log('result.data is array:', Array.isArray(result.data));
        if (result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
          console.log('result.data keys:', Object.keys(result.data));
        }
        console.log('===========================');
        
        if (result.success) {
          let consultationsList = [];
          
          if (Array.isArray(result.data)) {
            consultationsList = result.data;
            console.log('Using direct array, length:', consultationsList.length);
          } else if (result.data && Array.isArray(result.data.data)) {
            // Format paginé
            consultationsList = result.data.data;
            console.log('Using paginated format, length:', consultationsList.length);
          } else if (result.data && typeof result.data === 'object') {
            // Peut-être un objet avec une propriété array
            consultationsList = result.data.consultations || result.data.items || result.data.results || [];
            console.log('Using object format, length:', consultationsList.length);
          }
          
          console.log('Final consultations list:', consultationsList.length);
          setConsultations(consultationsList);
          
          if (consultationsList.length === 0) {
            console.warn('Aucune consultation trouvée pour ce patient');
          }
        } else {
          console.error('Failed to load consultations:', result.message || result.errors);
          setConsultations([]);
        }
      } catch (error) {
        console.error('Error loading consultations:', error);
        console.error('Error stack:', error.stack);
        setConsultations([]);
      } finally {
        setLoadingConsultations(false);
      }
    };

    const loadServiceTariffs = async () => {
      setLoadingServiceTariffs(true);
      try {
        const result = await ConsumApi.getPricingServices();
        if (result.success) {
          const list = Array.isArray(result.data) ? result.data : result.data?.data || result.data?.items || [];
          const consultationTariffs = (Array.isArray(list) ? list : []).filter(
            (item) => String(item?.category || '').toUpperCase() === 'CONSULTATION'
          );
          consultationTariffs.sort((a, b) => Number(Boolean(b?.isActive)) - Number(Boolean(a?.isActive)));
          setServiceTariffs(consultationTariffs);
        } else {
          setServiceTariffs([]);
        }
      } catch (e) {
        console.error('Error loading service tariffs:', e);
        setServiceTariffs([]);
      } finally {
        setLoadingServiceTariffs(false);
      }
    };

    loadPatient();
    loadMedecins();
    loadServiceTariffs();
    loadConsultations();
  }, [patientId]);

  // Initialiser le tarif de service par défaut
  useEffect(() => {
    if (serviceTariffs.length > 0 && !consultationForm.serviceTariffId) {
      setConsultationForm((prev) => ({ ...prev, serviceTariffId: serviceTariffs[0].id }));
    }
  }, [serviceTariffs.length]);

  const handleCreateConsultation = async () => {
    if (!consultationForm.patientId) {
      showError('Erreur', 'Veuillez sélectionner un patient');
      return;
    }
    if (!consultationForm.serviceTariffId) {
      showError('Erreur', 'Veuillez sélectionner le service de consultation (tarif).');
      return;
    }
    const fallbackMedecinId = medecins.length > 0 ? medecins[0].id : null;
    if (!fallbackMedecinId) {
      showError(
        'Erreur',
        'Aucun médecin disponible dans la table medecins. Veuillez créer un médecin côté backend avant de créer la consultation.'
      );
      return;
    }
    if (!paymentValidated) {
      showError('Erreur', 'Veuillez valider le paiement avant de créer la consultation.');
      return;
    }

    setLoading(true);
    try {
      // Nouvelle API: création sans choix d'infirmier à ce stade.
      const consultationData = {
        patientId: consultationForm.patientId,
        // API impose medecinId à la création; l'infirmier pourra ensuite transférer au médecin choisi.
        medecinId: fallbackMedecinId,
        serviceTariffId: consultationForm.serviceTariffId,
        type: consultationForm.type,
        category: consultationForm.category,
        consultationDate: consultationForm.consultationDate,
        reason: '',
        clinicalExamination: '',
        temperature: 0,
        systolicBloodPressure: 0,
        diastolicBloodPressure: 0,
        heartRate: 0,
        respiratoryRate: 0,
        weight: 0,
        height: 0,
        oxygenSaturation: 0,
        diagnostic: '',
        differentialDiagnosis: '',
        treatment: '',
        recommendations: '',
        privateNotes: '',
        nextAppointment: '',
        hospitalizationRequired: false,
        hospitalizationReason: '',
      };

      const result = await ConsumApi.createConsultation(consultationData);
      // Déferrer la notification pour éviter l'avertissement React 18 (notice in render)
      let processed;
      setTimeout(() => {
        processed = showApiResponse(result, {
          successTitle: 'Consultation créée',
          errorTitle: 'Erreur de création',
        });
      }, 0);
      processed = result.success
        ? { success: true, data: result.data, message: result.message, errors: [] }
        : { success: false, data: null, message: result.message, errors: result.errors || [] };

      if (processed.success) {
        setTimeout(() => showSuccess('Succès', 'Consultation créée avec succès'), 0);

        // Time tracking: arrivée + passage ACCUEIL (secrétaire)
        try {
          const userId = admin?.id || null;
          await transitionService({
            patientId: consultationForm.patientId,
            serviceType: 'ACCUEIL',
            handledByUserId: userId,
            reason: '',
            notes: '',
          });
        } catch (e) {
          // tracking non bloquant
          console.error('Time tracking (create consultation) failed:', e);
        }

        // Recharger la liste des consultations
        const resultConsultations = await ConsumApi.getConsultations({ patientId });
        if (resultConsultations.success) {
          let consultationsList = [];
          if (Array.isArray(resultConsultations.data)) {
            consultationsList = resultConsultations.data;
          } else if (resultConsultations.data && Array.isArray(resultConsultations.data.data)) {
            consultationsList = resultConsultations.data.data;
          } else if (resultConsultations.data && typeof resultConsultations.data === 'object') {
            consultationsList = resultConsultations.data.consultations || resultConsultations.data.items || resultConsultations.data.results || [];
          }
          setConsultations(consultationsList);
        }
        // Réinitialiser le formulaire
        setConsultationForm({
          patientId: patientId || '',
          type: 'PREMIERE_CONSULTATION',
          category: 'CONSULTATION_NORMALE',
          consultationDate: new Date().toISOString(),
          serviceTariffId: serviceTariffs.length > 0 ? serviceTariffs[0].id : '',
        });
        setPaymentValidated(false);
        setServiceInvoice(null);
        setPaymentForm({
          method: 'ESPECES',
          amount: 0,
          insuranceAmount: 0,
          patientAmount: 0,
          reference: '',
          details: '',
        });
      }
    } catch (error) {
      console.error('Error creating consultation:', error);
      showError('Erreur', 'Erreur lors de la création de la consultation');
    } finally {
      setLoading(false);
    }
  };

  const selectedTariff = serviceTariffs.find((t) => t.id === consultationForm.serviceTariffId) || null;
  const createDisabledReason = (() => {
    if (!consultationForm.patientId) return 'Patient manquant';
    if (!consultationForm.serviceTariffId) return 'Veuillez sélectionner le service de consultation';
    if (!paymentValidated) return 'Veuillez payer avant de créer la consultation';
    return '';
  })();
  const handleOpenPaymentDialog = () => {
    if (!consultationForm.serviceTariffId) {
      showError('Erreur', 'Veuillez sélectionner le service de consultation avant le paiement.');
      return;
    }
    if (!consultationForm.patientId) {
      showError('Erreur', 'Patient introuvable pour la génération de facture.');
      return;
    }
    if (paymentValidated && serviceInvoice?.id) {
      showSuccess('Paiement', 'Paiement déjà validé pour cette consultation.');
      return;
    }
    const amount = Number(selectedTariff?.price ?? 0);
    if (amount <= 0 || consultationForm.category === 'CONTROLE_GRATUIT') {
      setPaymentValidated(true);
      setServiceInvoice(null);
      showSuccess('Paiement', 'Consultation gratuite: aucune facture requise.');
      return;
    }
    setPaymentForm((prev) => ({
      ...prev,
      amount,
      insuranceAmount: 0,
      patientAmount: amount,
    }));
    setPaymentDialog({ open: true });
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialog({ open: false });
  };

  const handleValidatePayment = async () => {
    const amount = Number(paymentForm.amount ?? selectedTariff?.price ?? 0);
    const insuranceAmount = Math.max(0, Number(paymentForm.insuranceAmount ?? 0));
    const patientAmount = Math.max(0, Number(paymentForm.patientAmount ?? 0));
    const splitTotal = insuranceAmount + patientAmount;
    if (amount <= 0) {
      showError('Erreur', 'Le montant à payer doit être supérieur à 0.');
      return;
    }
    if (Math.abs(splitTotal - amount) > 0.001) {
      showError('Erreur', 'Montant assurance + montant patient doit être égal au montant total.');
      return;
    }

    setValidatingPayment(true);
    try {
      const invoiceRes = await ConsumApi.createBillingInvoice({
        patientId: consultationForm.patientId,
        consultationId: null,
        totalAmount: amount,
        insuranceAdjustedAmount: amount,
        currency: paymentForm.method,
        note: `Facture service consultation - ${selectedTariff?.name || 'Consultation'} - paiement: ${paymentForm.method}`,
      });
      const processed = showApiResponse(invoiceRes, {
        successTitle: 'Facture générée',
        errorTitle: 'Facturation',
      });
      if (!processed.success) return;

      const invoiceData = invoiceRes.data;
      const billingInvoiceId = invoiceData?.id;
      if (!billingInvoiceId) {
        showError('Facturation', 'Facture créée sans identifiant.');
        return;
      }

      const totalAmount = Number(invoiceData?.totalAmount ?? amount);
      const alreadyPaid = Number(invoiceData?.paidAmount ?? 0);
      const remainingAmount = Math.max(0, totalAmount - alreadyPaid);

      let finalInvoice = invoiceData;

      if (remainingAmount > 0) {
        const payRes = await ConsumApi.createBillingPayment({
          invoiceId: billingInvoiceId,
          method: paymentForm.method,
          amount: splitTotal,
          reference: paymentForm.reference?.trim() || '',
          details: [
            paymentForm.details?.trim() || '',
            `Paiement consultation - ${selectedTariff?.name || 'Consultation'}`,
            `Assurance: ${insuranceAmount}; Patient: ${patientAmount}; Total: ${splitTotal}`,
          ]
            .filter(Boolean)
            .join(' | '),
        });
        if (!payRes.success) {
          showApiResponse(payRes, { successTitle: '', errorTitle: 'Paiement' });
          return;
        }
        const paymentId = payRes.data?.id;
        if (paymentId) {
          const stRes = await ConsumApi.updateBillingPaymentStatus({ paymentId, status: 'VALIDEE' });
          if (!stRes?.success) {
            showError('Attention', 'Paiement enregistré mais la validation du statut a échoué. Vérifiez côté serveur.');
          }
        }
        const refreshed = await ConsumApi.getBillingInvoiceById(billingInvoiceId);
        if (refreshed?.success && refreshed.data) {
          finalInvoice = refreshed.data;
        }
      } else {
        const refreshed = await ConsumApi.getBillingInvoiceById(billingInvoiceId);
        if (refreshed?.success && refreshed.data) {
          finalInvoice = refreshed.data;
        }
      }

      setServiceInvoice(finalInvoice);
      setPaymentValidated(true);
      setPaymentDialog({ open: false });
      showSuccess('Paiement', 'Facture générée et paiement enregistré.');
      if (billingInvoiceId) {
        setTimeout(() => {
          handleOpenServiceInvoicePdf(billingInvoiceId);
        }, 300);
      }
    } catch (error) {
      console.error('Error validating payment / creating invoice:', error);
      showError('Erreur', 'Impossible de générer la facture de service');
    } finally {
      setValidatingPayment(false);
    }
  };

  const buildServiceFacturePdfData = (invoice) => {
    let patientName = 'Patient';
    if (invoice?.patient) {
      patientName = `${invoice.patient.firstName || ''} ${invoice.patient.lastName || ''}`.trim();
    } else if (patient) {
      patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
    }
    const amount = Number(invoice?.totalAmount ?? selectedTariff?.price ?? 0);
    const paid = Number(invoice?.paidAmount ?? 0);
    const paidFlag = isBillingInvoicePaid(invoice);
    let paymentEntries = [];
    if (Array.isArray(invoice?.payments)) {
      paymentEntries = invoice.payments;
    } else if (Array.isArray(invoice?.paymentHistory)) {
      paymentEntries = invoice.paymentHistory;
    }
    const extractBreakdownFromText = (text) => {
      if (!text) return null;
      const insuranceMatch = String(text).match(/Assurance:\s*([0-9]+(?:[.,][0-9]+)?)/i);
      const patientMatch = String(text).match(/Patient:\s*([0-9]+(?:[.,][0-9]+)?)/i);
      if (!insuranceMatch && !patientMatch) return null;
      const insuranceAmount = Number(String(insuranceMatch?.[1] || '0').replace(',', '.')) || 0;
      const patientAmount = Number(String(patientMatch?.[1] || '0').replace(',', '.')) || 0;
      return { insuranceAmount, patientAmount };
    };
    const lastPaymentWithBreakdown = [...paymentEntries]
      .reverse()
      .map((entry) => extractBreakdownFromText(entry?.details || entry?.description || entry?.note || ''))
      .find(Boolean);
    const montantAssurance = Number(lastPaymentWithBreakdown?.insuranceAmount ?? 0);
    const montantPatient = Number(lastPaymentWithBreakdown?.patientAmount ?? paid);

    return {
      id: invoice?.id,
      numeroFacture: invoice?.invoiceNumber || invoice?.id?.slice(0, 8),
      dateFacture: invoice?.createdAt || new Date().toISOString(),
      documentType: paidFlag ? 'receipt' : undefined,
      type: 'proforma',
      invoiceNature: 'SERVICE',
      clientName: patientName || 'Patient',
      patientId: invoice?.patient?.id || consultationForm.patientId,
      consultationId: invoice?.consultation?.id || undefined,
      montantTotal: amount,
      montantPaye: paid,
      montantAssurance,
      montantPatient,
      montantRestant: Math.max(0, amount - paid),
      status: paidFlag ? 'paid' : String(invoice?.status || 'pending').toLowerCase(),
      items: [
        {
          description: selectedTariff?.name || 'Service de consultation',
          quantity: 1,
          unitPrice: amount,
        },
      ],
    };
  };

  const generateServiceInvoicePdfBlob = async (invoiceId) => {
    const invoiceRes = await ConsumApi.getBillingInvoiceById(invoiceId);
    if (!invoiceRes.success || !invoiceRes.data) {
      throw new Error(invoiceRes.message || 'Impossible de charger la facture');
    }
    const facture = buildServiceFacturePdfData(invoiceRes.data);
    return pdf(React.createElement(FacturePdfDocument, { facture })).toBlob();
  };

  const handleOpenServiceInvoicePdf = async (invoiceId = serviceInvoice?.id) => {
    if (!invoiceId) {
      showError('Erreur', 'Aucune facture disponible');
      return;
    }
    setInvoicePdfLoading(true);
    try {
      const blob = await generateServiceInvoicePdfBlob(invoiceId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('Error opening service invoice PDF:', error);
      showError('Erreur', error.message || 'Impossible d’ouvrir la facture');
    } finally {
      setInvoicePdfLoading(false);
    }
  };

  const handleDownloadServiceInvoicePdf = async (invoiceId = serviceInvoice?.id) => {
    if (!invoiceId) {
      showError('Erreur', 'Aucune facture disponible');
      return;
    }
    setInvoicePdfLoading(true);
    try {
      const blob = await generateServiceInvoicePdfBlob(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture-service-${serviceInvoice?.invoiceNumber || invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading service invoice PDF:', error);
      showError('Erreur', error.message || 'Impossible de télécharger la facture');
    } finally {
      setInvoicePdfLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/patients/accueil');
  };

  const handleOpenDetails = async (consultation) => {
    if (!canViewConsultationDetails) return;
    setDetailsDialog({ open: true, loading: true, editing: false });
    setSelectedConsultation(null);
    setEditForm(null);
    setConsultationAnalyses([]);

    try {
      // Charger les détails complets de la consultation
      const result = await ConsumApi.getConsultationById(consultation.id);
      if (result.success) {
        const consultationData = result.data?.consultation || result.data;
        setSelectedConsultation(consultationData);
        // Initialiser le formulaire d'édition avec les données
        setEditForm({
          selectedMedecinId: consultationData.medecinId || consultationData.medecin?.id || '',
          clinicalExamination: consultationData.clinicalExamination || '',
          temperature: consultationData.temperature || 0,
          systolicBloodPressure: consultationData.systolicBloodPressure || 0,
          diastolicBloodPressure: consultationData.diastolicBloodPressure || 0,
          heartRate: consultationData.heartRate || 0,
          respiratoryRate: consultationData.respiratoryRate || 0,
          weight: consultationData.weight || 0,
          height: consultationData.height || 0,
          oxygenSaturation: consultationData.oxygenSaturation || 0,
          diagnostic: consultationData.diagnostic || '',
          differentialDiagnosis: consultationData.differentialDiagnosis || '',
          treatment: consultationData.treatment || '',
          recommendations: consultationData.recommendations || '',
          privateNotes: consultationData.privateNotes || '',
          nextAppointment: consultationData.nextAppointment || '',
          hospitalizationRequired: consultationData.hospitalizationRequired || false,
          hospitalizationReason: consultationData.hospitalizationReason || '',
        });

        setLoadingConsultationAnalyses(true);
        try {
          const { ok: analysesOk, analyses } = await fetchLaboratoryAnalysesForConsultation(
            consultationData,
            consultation
          );
          setConsultationAnalyses(analysesOk ? analyses : []);
        } catch (e) {
          console.error('Error loading consultation analyses:', e);
          setConsultationAnalyses([]);
        } finally {
          setLoadingConsultationAnalyses(false);
        }
      } else {
        showError('Erreur', 'Impossible de charger les détails de la consultation');
        setDetailsDialog({ open: false, loading: false, editing: false });
      }
    } catch (error) {
      console.error('Error loading consultation details:', error);
      showError('Erreur', 'Erreur lors du chargement des détails');
      setDetailsDialog({ open: false, loading: false, editing: false });
    } finally {
      setDetailsDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCloseDetails = () => {
    setDetailsDialog({ open: false, loading: false, editing: false });
    setSelectedConsultation(null);
    setEditForm(null);
    setConsultationAnalyses([]);
    setLoadingConsultationAnalyses(false);
  };

  const handleToggleEdit = () => {
    setDetailsDialog((prev) => ({ ...prev, editing: !prev.editing }));
  };

  const handleSaveConsultation = async () => {
    if (!selectedConsultation || !editForm) return;

    const currentMedecinId = selectedConsultation.medecinId || selectedConsultation.medecin?.id;
    const selectedMedecinId = editForm.selectedMedecinId || currentMedecinId;
    if (!selectedMedecinId) {
      showError('Erreur', 'Veuillez sélectionner un médecin pour enregistrer les constantes.');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        ...editForm,
        patientId: selectedConsultation.patientId || selectedConsultation.patient?.id,
        medecinId: selectedMedecinId,
        serviceTariffId: selectedConsultation.serviceTariffId || selectedConsultation.serviceTariff?.id,
        type: selectedConsultation.type,
        category: selectedConsultation.category || 'CONSULTATION_NORMALE',
        status: selectedConsultation.status,
        consultationDate: selectedConsultation.consultationDate,
      };

      const result = await ConsumApi.updateConsultation(selectedConsultation.id, updateData);
      const processed = showApiResponse(result, {
        successTitle: 'Consultation mise à jour',
        errorTitle: 'Erreur de mise à jour',
      });

      if (processed.success) {
        showSuccess('Succès', 'Consultation mise à jour avec succès');
        setDetailsDialog((prev) => ({ ...prev, editing: false }));

        // Time tracking: passage INFIRMIER lors de l'enregistrement des constantes
        try {
          const userId = admin?.id || null;
          const pid = selectedConsultation.patientId || selectedConsultation.patient?.id;
          if (pid) {
            await transitionService({
              patientId: pid,
              serviceType: 'INFIRMIER',
              handledByUserId: userId,
              reason: selectedConsultation.reason || '',
              notes: 'Prise des constantes',
            });
          }
        } catch (e) {
          console.error('Time tracking (save constantes) failed:', e);
        }

        // Recharger les détails
        await handleOpenDetails({ id: selectedConsultation.id });
        // Recharger la liste des consultations
        const resultConsultations = await ConsumApi.getConsultations({ patientId });
        if (resultConsultations.success) {
          let consultationsList = [];
          if (Array.isArray(resultConsultations.data)) {
            consultationsList = resultConsultations.data;
          } else if (resultConsultations.data && Array.isArray(resultConsultations.data.data)) {
            consultationsList = resultConsultations.data.data;
          } else if (resultConsultations.data && typeof resultConsultations.data === 'object') {
            consultationsList = resultConsultations.data.consultations || resultConsultations.data.items || resultConsultations.data.results || [];
          }
          setConsultations(consultationsList);
        }
      }
    } catch (error) {
      console.error('Error updating consultation:', error);
      showError('Erreur', 'Erreur lors de la mise à jour de la consultation');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenTransferToDoctor = () => {
    setTransferDoctorDialog({ open: true, medecinId: medecins.length > 0 ? medecins[0].id : '' });
  };

  const handleTransferToDoctor = async () => {
    if (!selectedConsultation) return;
    const { medecinId } = transferDoctorDialog;
    if (!medecinId) {
      showError('Erreur', 'Veuillez sélectionner un médecin');
      return;
    }

    setTransferring(true);
    setTransferDoctorDialog({ open: false, medecinId: '' });
    try {
      // Assigner le médecin et passer en EN_COURS (infirmier a pris les constantes, transfert au médecin)
      const updatePayload = {
        patientId: selectedConsultation.patientId || selectedConsultation.patient?.id,
        medecinId,
        type: selectedConsultation.type || 'PREMIERE_CONSULTATION',
        status: 'EN_COURS',
        consultationDate: selectedConsultation.consultationDate,
        reason: selectedConsultation.reason,
        clinicalExamination: editForm?.clinicalExamination ?? selectedConsultation.clinicalExamination,
        temperature: editForm?.temperature ?? selectedConsultation.temperature,
        systolicBloodPressure: editForm?.systolicBloodPressure ?? selectedConsultation.systolicBloodPressure,
        diastolicBloodPressure: editForm?.diastolicBloodPressure ?? selectedConsultation.diastolicBloodPressure,
        heartRate: editForm?.heartRate ?? selectedConsultation.heartRate,
        respiratoryRate: editForm?.respiratoryRate ?? selectedConsultation.respiratoryRate,
        weight: editForm?.weight ?? selectedConsultation.weight,
        height: editForm?.height ?? selectedConsultation.height,
        oxygenSaturation: editForm?.oxygenSaturation ?? selectedConsultation.oxygenSaturation,
        diagnostic: editForm?.diagnostic ?? selectedConsultation.diagnostic,
        differentialDiagnosis: editForm?.differentialDiagnosis ?? selectedConsultation.differentialDiagnosis,
        treatment: editForm?.treatment ?? selectedConsultation.treatment,
        recommendations: editForm?.recommendations ?? selectedConsultation.recommendations,
        privateNotes: editForm?.privateNotes ?? selectedConsultation.privateNotes,
        nextAppointment: editForm?.nextAppointment ?? selectedConsultation.nextAppointment,
        hospitalizationRequired: editForm?.hospitalizationRequired ?? selectedConsultation.hospitalizationRequired,
        hospitalizationReason: editForm?.hospitalizationReason ?? selectedConsultation.hospitalizationReason,
      };
      const result = await ConsumApi.updateConsultation(selectedConsultation.id, updatePayload);
      const processed = showApiResponse(result, {
        successTitle: 'Patient transféré',
        errorTitle: 'Erreur de transfert',
      });

      if (processed.success) {
        showSuccess('Succès', 'Patient transféré au médecin avec succès');

        // Time tracking: clôturer uniquement le passage infirmerie (le médecin démarre MEDECIN à la réception)
        try {
          const pid = selectedConsultation.patientId || selectedConsultation.patient?.id;
          if (pid) {
            await closeCurrentPassageOnly(pid);
          }
        } catch (e) {
          console.error('Time tracking (close passage infirmerie after transfer) failed:', e);
        }

        await handleOpenDetails({ id: selectedConsultation.id });
        const resultConsultations = await ConsumApi.getConsultations({ patientId });
        if (resultConsultations.success) {
          let consultationsList = [];
          if (Array.isArray(resultConsultations.data)) {
            consultationsList = resultConsultations.data;
          } else if (resultConsultations.data && Array.isArray(resultConsultations.data.data)) {
            consultationsList = resultConsultations.data.data;
          } else if (resultConsultations.data && typeof resultConsultations.data === 'object') {
            consultationsList = resultConsultations.data.consultations || resultConsultations.data.items || resultConsultations.data.results || [];
          }
          setConsultations(consultationsList);
        }
      }
    } catch (error) {
      console.error('Error transferring to doctor:', error);
      showError('Erreur', 'Erreur lors du transfert au médecin');
    } finally {
      setTransferring(false);
    }
  };

  if (loadingPatient) {
    return (
      <>
        <Helmet>
          <title> Création Consultation | PREVENTIC </title>
        </Helmet>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <LoadingButton loading>Chargement des informations du patient...</LoadingButton>
          </Box>
        </Container>
      </>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title> Création Consultation | PREVENTIC </title>
      </Helmet>
      {contextHolder}
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Créer une consultation</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Remplissez les informations pour créer une nouvelle consultation
            </Typography>
          </Box>

          <Card sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6">Informations du patient</Typography>
              </Box>

              <Alert
                severity="info"
                icon={<Iconify icon="eva:info-fill" />}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  <Typography variant="body2">
                    Patient : <strong>{patient.firstName} {patient.lastName}</strong>
                  </Typography>
                  <Chip
                    label={patient.gender === 'MALE' || patient.gender === 'M' ? 'M.' : 'F.'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                  {patient.phone && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                      {patient.phone}
                    </Typography>
                  )}
                </Box>
              </Alert>

              <Divider />

              <Box>
                <Typography variant="h6">Informations de la consultation</Typography>
              </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Parcours de prise en charge :</strong> assignez le patient à un infirmier. L&apos;infirmier prendra ses constantes puis l&apos;assignera à un médecin pour la suite.
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Type de consultation</InputLabel>
                    <Select
                      value={consultationForm.type}
                      label="Type de consultation"
                      onChange={(e) => setConsultationForm((prev) => ({ ...prev, type: e.target.value }))}
                    >
                      {Object.entries(CONSULTATION_TYPES).map(([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Catégorie</InputLabel>
                    <Select
                      value={consultationForm.category}
                      label="Catégorie"
                      onChange={(e) => setConsultationForm((prev) => ({ ...prev, category: e.target.value }))}
                    >
                      {Object.entries(CONSULTATION_CATEGORIES).map(([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Service de consultation</InputLabel>
                    <Select
                      value={consultationForm.serviceTariffId || ''}
                      label="Service de consultation"
                      onChange={(e) => {
                        setPaymentValidated(false);
                        setConsultationForm((prev) => ({ ...prev, serviceTariffId: e.target.value || '' }));
                      }}
                      disabled={loadingServiceTariffs}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>{loadingServiceTariffs ? 'Chargement...' : '— Sélectionner un service —'}</em>
                      </MenuItem>
                      {serviceTariffs.map((t) => (
                        <MenuItem key={t.id} value={t.id}>
                          {t.name} {t.dayType ? `— ${t.dayType}` : ''} {!t.isActive ? '— Inactif' : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {selectedTariff && (
                    <Typography variant="caption" color="text.secondary">
                      Prix: <strong>{Number(selectedTariff.price ?? 0).toLocaleString()} FCFA</strong> ({selectedTariff.dayType || '—'})
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Date et heure de création"
                    value={
                      consultationForm.consultationDate
                        ? new Date(consultationForm.consultationDate).toISOString().slice(0, 16)
                        : ''
                    }
                    onChange={(e) =>
                      setConsultationForm((prev) => ({
                        ...prev,
                        consultationDate: new Date(e.target.value).toISOString(),
                      }))
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button onClick={handleCancel}>Annuler</Button>
                <LoadingButton
                  variant="outlined"
                  color={paymentValidated ? 'success' : 'primary'}
                  onClick={handleOpenPaymentDialog}
                  loading={validatingPayment}
                  disabled={!consultationForm.serviceTariffId || paymentValidated || validatingPayment}
                >
                  {paymentValidated ? 'Paiement validé' : 'Payer'}
                </LoadingButton>
                <LoadingButton
                  variant="contained"
                  onClick={handleCreateConsultation}
                  loading={loading}
                  disabled={Boolean(createDisabledReason)}
                >
                  Créer la consultation (prise de constantes)
                </LoadingButton>
              </Stack>
              {createDisabledReason && (
                <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'right', mt: 1 }}>
                  {createDisabledReason}
                </Typography>
              )}
              {serviceInvoice?.id && (
                <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Facture générée: {serviceInvoice.invoiceNumber || serviceInvoice.id?.slice(0, 8)}
                  </Typography>
                  <Button size="small" variant="text" onClick={() => handleOpenServiceInvoicePdf()}>
                    Voir facture
                  </Button>
                  <LoadingButton
                    size="small"
                    variant="outlined"
                    loading={invoicePdfLoading}
                    onClick={() => handleDownloadServiceInvoicePdf()}
                  >
                    Télécharger
                  </LoadingButton>
                </Stack>
              )}
            </Stack>
          </Card>

          {/* Liste des consultations */}
          <Card sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6">Consultations du patient</Typography>
              </Box>

              {(() => {
                if (loadingConsultations) {
                  return (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <LoadingButton loading>Chargement des consultations...</LoadingButton>
                    </Box>
                  );
                }
                if (consultations.length === 0) {
                  return <Alert severity="info">Aucune consultation enregistrée pour ce patient.</Alert>;
                }
                return (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Numéro</TableCell>
                        <TableCell>Médecin</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Statut</TableCell>
                        {canViewConsultationDetails && <TableCell align="right">Actions</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {consultations.map((consultation) => (
                        <TableRow
                          key={consultation.id}
                          hover={canViewConsultationDetails}
                          sx={{ cursor: canViewConsultationDetails ? 'pointer' : 'default' }}
                          onClick={canViewConsultationDetails ? () => handleOpenDetails(consultation) : undefined}
                        >
                          <TableCell>
                            <Typography variant="subtitle2">
                              {consultation.consultationNumber || consultation.id?.substring(0, 8)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {consultation.status === 'PRISE_CONSTANTES'
                                ? '— Infirmier (constantes)'
                                : `Dr. ${consultation.medecin?.firstName || consultation.medecin?.firstname || 'N/A'} ${consultation.medecin?.lastName || consultation.medecin?.lastname || ''}`}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {CONSULTATION_TYPES[consultation.type] || consultation.type || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {fDateTime(consultation.consultationDate || consultation.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={STATUS_LABELS[consultation.status] || consultation.status}
                              color={STATUS_COLORS[consultation.status] || 'default'}
                              size="small"
                            />
                          </TableCell>
                          {canViewConsultationDetails && (
                            <TableCell align="right">
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDetails(consultation);
                                }}
                              >
                                Voir détails
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                );
              })()}
            </Stack>
          </Card>
        </Stack>
      </Container>

      {/* Dialog de détails de consultation */}
      <Dialog open={detailsDialog.open} onClose={handleCloseDetails} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Détails de la Consultation</Typography>
            {!detailsDialog.loading && selectedConsultation && (
              <Button
                variant={detailsDialog.editing ? 'outlined' : 'contained'}
                startIcon={<Iconify icon={detailsDialog.editing ? 'eva:close-fill' : 'eva:edit-fill'} />}
                onClick={handleToggleEdit}
              >
                {detailsDialog.editing ? 'Annuler' : 'Modifier'}
              </Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailsDialog.loading ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <LoadingButton loading>Chargement des détails...</LoadingButton>
            </Box>
          ) : (
            selectedConsultation && editForm && (
              <Stack spacing={3} sx={{ mt: 1 }}>
                {/* Informations de base (lecture seule) */}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Numéro de consultation</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {selectedConsultation.consultationNumber || selectedConsultation.id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Statut</Typography>
                    <Chip
                      label={STATUS_LABELS[selectedConsultation.status] || selectedConsultation.status}
                      color={STATUS_COLORS[selectedConsultation.status] || 'default'}
                      size="small"
                    />
                  </Grid>
                </Grid>

                <Divider>Informations Patient</Divider>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Nom complet</Typography>
                    <Typography variant="body1">
                      {selectedConsultation.patient?.firstName} {selectedConsultation.patient?.lastName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Téléphone</Typography>
                    <Typography variant="body1">{selectedConsultation.patient?.phone || 'N/A'}</Typography>
                  </Grid>
                  {detailsDialog.editing && (
                    <Grid item xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>Médecin (obligatoire pour enregistrer)</InputLabel>
                        <Select
                          value={editForm.selectedMedecinId || ''}
                          label="Médecin (obligatoire pour enregistrer)"
                          onChange={(e) => setEditForm({ ...editForm, selectedMedecinId: e.target.value || '' })}
                          displayEmpty
                        >
                          <MenuItem value="">
                            <em>{medecins.length === 0 ? 'Chargement...' : '— Sélectionner un médecin —'}</em>
                          </MenuItem>
                          {medecins.map((med) => (
                            <MenuItem key={med.id} value={med.id}>
                              Dr. {med.firstName || med.first_name} {med.lastName || med.last_name}
                              {med.speciality ? ` — ${med.speciality}` : ''}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                </Grid>

                <Divider>Examen Clinique</Divider>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Examen clinique"
                      value={editForm.clinicalExamination}
                      onChange={(e) => setEditForm({ ...editForm, clinicalExamination: e.target.value })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                </Grid>

                <Divider>Signes Vitaux</Divider>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Température (°C)"
                      value={editForm.temperature}
                      onChange={(e) => setEditForm({ ...editForm, temperature: parseFloat(e.target.value) || 0 })}
                      disabled={!detailsDialog.editing}
                      inputProps={{ step: 0.1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Pression artérielle systolique (mmHg)"
                      value={editForm.systolicBloodPressure}
                      onChange={(e) => setEditForm({ ...editForm, systolicBloodPressure: parseInt(e.target.value, 10) || 0 })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Pression artérielle diastolique (mmHg)"
                      value={editForm.diastolicBloodPressure}
                      onChange={(e) => setEditForm({ ...editForm, diastolicBloodPressure: parseInt(e.target.value, 10) || 0 })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Fréquence cardiaque (bpm)"
                      value={editForm.heartRate}
                      onChange={(e) => setEditForm({ ...editForm, heartRate: parseInt(e.target.value, 10) || 0 })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Fréquence respiratoire (rpm)"
                      value={editForm.respiratoryRate}
                      onChange={(e) => setEditForm({ ...editForm, respiratoryRate: parseInt(e.target.value, 10) || 0 })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Saturation en oxygène (%)"
                      value={editForm.oxygenSaturation}
                      onChange={(e) => setEditForm({ ...editForm, oxygenSaturation: parseInt(e.target.value, 10) || 0 })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Poids (kg)"
                      value={editForm.weight}
                      onChange={(e) => setEditForm({ ...editForm, weight: parseFloat(e.target.value) || 0 })}
                      disabled={!detailsDialog.editing}
                      inputProps={{ step: 0.1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Taille (cm)"
                      value={editForm.height}
                      onChange={(e) => setEditForm({ ...editForm, height: parseFloat(e.target.value) || 0 })}
                      disabled={!detailsDialog.editing}
                      inputProps={{ step: 0.01 }}
                    />
                  </Grid>
                </Grid>

                <Divider>Analyses de laboratoire</Divider>
                {loadingConsultationAnalyses && (
                  <Box sx={{ py: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Chargement des analyses…
                    </Typography>
                  </Box>
                )}
                {!loadingConsultationAnalyses && consultationAnalyses.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Aucune analyse liée à cette consultation.
                  </Typography>
                )}
                {!loadingConsultationAnalyses && consultationAnalyses.length > 0 && (
                  <Stack spacing={1}>
                    {consultationAnalyses.map((analysis, index) => {
                      const biologyItems = extractBiologyItemNames(analysis);
                      return (
                        <Card key={analysis.id || index} variant="outlined" sx={{ p: 1.5 }}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            spacing={1}
                          >
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {analysis.analysisName || "Demande d'analyse laboratoire"}
                              </Typography>
                              {Number(analysis.price) > 0 && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {Number(analysis.price).toLocaleString('fr-FR')} FCFA
                                </Typography>
                              )}
                              {biologyItems.length > 0 && (
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                  Actes biologiques: {biologyItems.join(', ')}
                                </Typography>
                              )}
                            </Box>
                            <Chip
                              size="small"
                              label={consultationAnalysisStatusChipLabel(analysis.status)}
                              color={consultationAnalysisStatusChipColor(analysis.status)}
                            />
                          </Stack>
                        </Card>
                      );
                    })}
                  </Stack>
                )}

                {!isInfirmier && (
                  <>
                <Divider>Diagnostic et Traitement</Divider>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    {(() => {
                      const hasDoctor =
                        Boolean(selectedConsultation.medecinId) || Boolean(selectedConsultation.medecin?.id);
                      let diagnosticHelperText;
                      if (isInfirmier) diagnosticHelperText = 'Réservé au médecin';
                      else if (!hasDoctor) diagnosticHelperText = 'Rempli par le médecin après transfert';

                      const diagnosticDisabled = !detailsDialog.editing || isInfirmier || !hasDoctor;

                      return (
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Diagnostic"
                      value={editForm.diagnostic}
                      onChange={(e) => setEditForm({ ...editForm, diagnostic: e.target.value })}
                      disabled={diagnosticDisabled}
                      helperText={diagnosticHelperText}
                    />
                      );
                    })()}
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Diagnostic différentiel"
                      value={editForm.differentialDiagnosis}
                      onChange={(e) => setEditForm({ ...editForm, differentialDiagnosis: e.target.value })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    {(() => {
                      const hasDoctor =
                        Boolean(selectedConsultation.medecinId) || Boolean(selectedConsultation.medecin?.id);
                      let treatmentHelperText;
                      if (isInfirmier) treatmentHelperText = 'Réservé au médecin';
                      else if (!hasDoctor) treatmentHelperText = 'Rempli par le médecin après transfert';

                      const treatmentDisabled = !detailsDialog.editing || isInfirmier || !hasDoctor;

                      return (
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Traitement"
                      value={editForm.treatment}
                      onChange={(e) => setEditForm({ ...editForm, treatment: e.target.value })}
                      disabled={treatmentDisabled}
                      helperText={treatmentHelperText}
                    />
                      );
                    })()}
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Recommandations"
                      value={editForm.recommendations}
                      onChange={(e) => setEditForm({ ...editForm, recommendations: e.target.value })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Notes privées"
                      value={editForm.privateNotes}
                      onChange={(e) => setEditForm({ ...editForm, privateNotes: e.target.value })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Prochain rendez-vous"
                      value={editForm.nextAppointment ? new Date(editForm.nextAppointment).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setEditForm({ ...editForm, nextAppointment: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                      disabled={!detailsDialog.editing}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>

                <Divider>Hospitalisation</Divider>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Hospitalisation requise</InputLabel>
                      <Select
                        value={editForm.hospitalizationRequired ? 'true' : 'false'}
                        label="Hospitalisation requise"
                        onChange={(e) => setEditForm({ ...editForm, hospitalizationRequired: e.target.value === 'true' })}
                        disabled={!detailsDialog.editing}
                      >
                        <MenuItem value="false">Non</MenuItem>
                        <MenuItem value="true">Oui</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {editForm.hospitalizationRequired && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Raison de l'hospitalisation"
                        value={editForm.hospitalizationReason}
                        onChange={(e) => setEditForm({ ...editForm, hospitalizationReason: e.target.value })}
                        disabled={!detailsDialog.editing}
                      />
                    </Grid>
                  )}
                </Grid>
                  </>
                )}
              </Stack>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Fermer</Button>
          {detailsDialog.editing && (
            <LoadingButton variant="contained" onClick={handleSaveConsultation} loading={saving}>
              Enregistrer
            </LoadingButton>
          )}
          {!detailsDialog.editing && selectedConsultation && (selectedConsultation.status === 'PRISE_CONSTANTES' || selectedConsultation.status === 'EN_ATTENTE') && (
            <LoadingButton
              variant="contained"
              color="primary"
              onClick={handleOpenTransferToDoctor}
              loading={transferring}
              startIcon={<Iconify icon="eva:person-add-fill" />}
            >
              Transférer au médecin
            </LoadingButton>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog choix du médecin pour le transfert */}
      <Dialog open={paymentDialog.open} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Payer la consultation</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Montant à payer"
              type="number"
              value={paymentForm.amount}
              InputProps={{
                readOnly: true,
                endAdornment: <InputAdornment position="end">FCFA</InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="Montant pris en charge par l'assurance"
              type="number"
              value={paymentForm.insuranceAmount}
              onChange={(e) =>
                setPaymentForm((prev) => {
                  const totalAmount = Math.max(0, Number(prev.amount || 0));
                  const insuranceAmount = Math.max(0, parseFloat(e.target.value) || 0);
                  const normalizedInsurance = Math.min(insuranceAmount, totalAmount);
                  return {
                    ...prev,
                    insuranceAmount: normalizedInsurance,
                    patientAmount: Math.max(0, totalAmount - normalizedInsurance),
                  };
                })
              }
              InputProps={{
                endAdornment: <InputAdornment position="end">FCFA</InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="Montant payé par le patient"
              type="number"
              value={paymentForm.patientAmount}
              onChange={(e) =>
                setPaymentForm((prev) => ({
                  ...prev,
                  patientAmount: Math.max(0, parseFloat(e.target.value) || 0),
                }))
              }
              InputProps={{
                endAdornment: <InputAdornment position="end">FCFA</InputAdornment>,
              }}
              helperText={`Vérification: ${(
                Number(paymentForm.insuranceAmount || 0) + Number(paymentForm.patientAmount || 0)
              ).toLocaleString('fr-FR')} / ${Number(paymentForm.amount || 0).toLocaleString('fr-FR')} FCFA`}
            />
            <FormControl fullWidth>
              <InputLabel>Moyen de paiement</InputLabel>
              <Select
                label="Moyen de paiement"
                value={paymentForm.method}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, method: e.target.value }))}
                disabled={validatingPayment}
              >
                <MenuItem value="ESPECES">Espèces</MenuItem>
                <MenuItem value="MOBILE_MONEY">Mobile Money</MenuItem>
                <MenuItem value="CARTE_BANCAIRE">Carte bancaire</MenuItem>
                <MenuItem value="VIREMENT">Virement</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Référence (optionnel)"
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm((prev) => ({ ...prev, reference: e.target.value }))}
              disabled={validatingPayment}
            />
            <TextField
              fullWidth
              label="Détails (optionnel)"
              multiline
              rows={2}
              value={paymentForm.details}
              onChange={(e) => setPaymentForm((prev) => ({ ...prev, details: e.target.value }))}
              disabled={validatingPayment}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog} disabled={validatingPayment}>
            Annuler
          </Button>
          <LoadingButton variant="contained" onClick={handleValidatePayment} loading={validatingPayment}>
            Confirmer le paiement
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Dialog choix du médecin pour le transfert */}
      <Dialog open={transferDoctorDialog.open} onClose={() => setTransferDoctorDialog({ open: false, medecinId: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Choisir le médecin</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Médecin</InputLabel>
            <Select
              value={transferDoctorDialog.medecinId}
              label="Médecin"
              onChange={(e) => setTransferDoctorDialog((prev) => ({ ...prev, medecinId: e.target.value }))}
            >
              {medecins.map((medecin) => (
                <MenuItem key={medecin.id} value={medecin.id}>
                  Dr. {medecin.firstName || medecin.firstname} {medecin.lastName || medecin.lastname} — {medecin.speciality || 'Médecine générale'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferDoctorDialog({ open: false, medecinId: '' })}>Annuler</Button>
          <LoadingButton variant="contained" onClick={handleTransferToDoctor} loading={transferring}>
            Confirmer le transfert
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
