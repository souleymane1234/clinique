import React from 'react';
import PropTypes from 'prop-types';
import { Page, Text, View, Font, Image, Document, StyleSheet } from '@react-pdf/renderer';

import { fDate } from 'src/utils/format-time';

import OpenSansBold from 'src/assets/fonts/Open_Sans/static/OpenSans-Bold.ttf';
import OpenSansLight from 'src/assets/fonts/Open_Sans/static/OpenSans-Light.ttf';
import OpenSansItalic from 'src/assets/fonts/Open_Sans/static/OpenSans-Italic.ttf';
import OpenSansRegular from 'src/assets/fonts/Open_Sans/static/OpenSans-Regular.ttf';
import OpenSansBoldItalic from 'src/assets/fonts/Open_Sans/static/OpenSans-BoldItalic.ttf';
import OpenSansLightItalic from 'src/assets/fonts/Open_Sans/static/OpenSans-LightItalic.ttf';

// Fonction pour formater les nombres avec espace comme séparateur de milliers
const formatNumber = (number) => {
  if (!number && number !== 0) return '0';
  // Conversion en string et ajout manuel des espaces
  const numStr = Math.floor(number).toString();
  const parts = [];
  for (let i = numStr.length - 1, j = 0; i >= 0; i -= 1, j += 1) {
    if (j > 0 && j % 3 === 0) {
      parts.unshift(' ');
    }
    parts.unshift(numStr[i]);
  }
  return parts.join('');
};

Font.register({
  family: 'Open Sans',
  fonts: [
    { src: OpenSansLight, fontWeight: 300, fontStyle: 'normal' },
    { src: OpenSansLightItalic, fontWeight: 300, fontStyle: 'italic' },
    { src: OpenSansRegular, fontWeight: 400, fontStyle: 'normal' },
    { src: OpenSansItalic, fontWeight: 400, fontStyle: 'italic' },
    { src: OpenSansBold, fontWeight: 700, fontStyle: 'normal' },
    { src: OpenSansBoldItalic, fontWeight: 700, fontStyle: 'italic' },
  ],
});

// Styles du PDF
const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 9,
    fontFamily: 'Open Sans',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    position: 'relative',
  },
  // Container pour le filigrane
  watermarkContainer: {
    position: 'absolute',
    top: 200,
    left: 0,
    right: 0,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  // Filigrane logo en arrière-plan
  watermark: {
    width: 350,
    height: 'auto',
    opacity: 0.12,
  },
  // En-tête
  header: {
    width: '100%',
    marginBottom: 15,
  },
  headerImage: {
    width: '100%',
    height: 'auto',
    maxHeight: 120,
    objectFit: 'contain',
  },
  // Contenu principal
  content: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 60,
    position: 'relative',
    zIndex: 1,
  },
  // Titre de la facture
  invoiceTitle: {
    fontSize: 18,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 8,
    color: '#000000',
  },
  invoiceSubtitle: {
    fontSize: 12,
    fontWeight: 400,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666666',
  },
  // Informations facture et client
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoBox: {
    width: '48%',
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: 700,
    marginBottom: 4,
    color: '#333333',
  },
  infoText: {
    fontSize: 9,
    marginBottom: 3,
    color: '#000000',
  },
  // Tableau des articles
  table: {
    width: '100%',
    marginTop: 20,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottom: '2 solid #000000',
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 700,
    color: '#000000',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottom: '1 solid #e0e0e0',
  },
  tableCell: {
    fontSize: 8,
    color: '#000000',
  },
  colDescription: {
    width: '50%',
  },
  colQuantity: {
    width: '15%',
    textAlign: 'center',
  },
  colPrice: {
    width: '17.5%',
    textAlign: 'right',
  },
  colTotal: {
    width: '17.5%',
    textAlign: 'right',
    fontWeight: 600,
  },
  // Totaux
  totalsSection: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
    width: '40%',
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: 600,
    width: '60%',
    textAlign: 'right',
    paddingRight: 10,
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 700,
    width: '40%',
    textAlign: 'right',
    color: '#000000',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTop: '2 solid #000000',
    width: '40%',
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: 700,
    width: '60%',
    textAlign: 'right',
    paddingRight: 10,
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 700,
    width: '40%',
    textAlign: 'right',
    color: '#000000',
  },
  // Section paiements (pour factures normales uniquement)
  paymentSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTop: '1 solid #e0e0e0',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 8,
    color: '#666666',
  },
  paymentValue: {
    fontSize: 8,
    fontWeight: 600,
    color: '#000000',
  },
  // Note proforma
  proformaNote: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#fff9e6',
    border: '1 solid #ffd700',
    borderRadius: 4,
  },
  proformaNoteText: {
    fontSize: 8,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#856404',
  },
  // Pied de page
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: '#f5f5f5',
    borderTop: '1 solid #e0e0e0',
  },
  footerText: {
    fontSize: 7,
    textAlign: 'center',
    color: '#666666',
    marginBottom: 2,
    lineHeight: 1.4,
  },
  footerTextBold: {
    fontSize: 7,
    textAlign: 'center',
    color: '#333333',
    fontWeight: 600,
    marginBottom: 2,
    lineHeight: 1.4,
  },
  // Cachet en bas à droite
  cachetContainer: {
    position: 'absolute',
    bottom: 100,
    right: 40,
    width: 100,
    height: 'auto',
    zIndex: 2,
  },
  cachetImage: {
    width: '100%',
    height: 'auto',
    maxHeight: 100,
    objectFit: 'contain',
  },
});

// Composant PDF de la facture
const FacturePdfDocument = ({ facture }) => {
  // Déterminer si c'est une proforma (seulement ce cas garde le cachet)
  const isProforma = facture.type === 'proforma' || facture.invoiceType === 'proforma';
  const items = facture.items || [];
  
  // Utiliser les images en base64 si disponibles, sinon utiliser les URLs
  const headerImageSrc = facture._headerImage || 
    (typeof window !== 'undefined' 
      ? `${window.location.origin}/document/TETE.jpg`
      : '/document/TETE.jpg');
  
  const watermarkLogo = facture._watermarkLogo || 
    (typeof window !== 'undefined' 
      ? `${window.location.origin}/document/logo.jpg`
      : '/document/logo.jpg');
  
  const cachetImageSrc = facture._cachetImage || 
    (typeof window !== 'undefined' 
      ? `${window.location.origin}/assets/images/cachet.png`
      : '/assets/images/cachet.png');
  
  // Calculer les totaux
  const totalHT = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Logo en filigrane transparent (arrière-plan) */}
        {watermarkLogo && (
          <View style={styles.watermarkContainer}>
            <Image
              src={watermarkLogo}
              style={styles.watermark}
              cache={false}
            />
          </View>
        )}

        {/* En-tête avec image */}
        <View style={styles.header}>
          <Image
            src={headerImageSrc}
            style={styles.headerImage}
            cache={false}
          />
        </View>

        {/* Contenu principal */}
        <View style={styles.content}>
          {/* Titre */}
          <Text style={styles.invoiceTitle}>
            {isProforma ? 'FACTURE PROFORMA' : 'REÇU'}
          </Text>
          {isProforma && (
            <Text style={styles.invoiceSubtitle}>
              (Document à titre informatif - Non valable pour paiement)
            </Text>
          )}

          {/* Informations facture et client */}
          <View style={styles.infoSection}>
            {/* Informations facture */}
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>FACTURE N°</Text>
              <Text style={styles.infoText}>{facture.numeroFacture || `FAC-${facture.id?.slice(0, 8)}`}</Text>
              
              <Text style={styles.infoLabel}>DATE</Text>
              <Text style={styles.infoText}>
                {facture.dateFacture ? fDate(facture.dateFacture, 'dd/MM/yyyy') : fDate(new Date(), 'dd/MM/yyyy')}
              </Text>
              
              {facture.dateEcheance && (
                <>
                  <Text style={styles.infoLabel}>DATE D&apos;ÉCHÉANCE</Text>
                  <Text style={styles.infoText}>{fDate(facture.dateEcheance, 'dd/MM/yyyy')}</Text>
                </>
              )}
            </View>

            {/* Informations client */}
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>CLIENT</Text>
              <Text style={styles.infoText}>{facture.clientName || facture.client?.nom || '-'}</Text>
              
              {facture.client?.numero && (
                <Text style={styles.infoText}>Tél: {facture.client.numero}</Text>
              )}
              
              {facture.client?.email && (
                <Text style={styles.infoText}>Email: {facture.client.email}</Text>
              )}
              
              {facture.clientAddress && (
                <Text style={styles.infoText}>{facture.clientAddress}</Text>
              )}
            </View>
          </View>

          {/* Tableau des articles */}
          <View style={styles.table}>
            {/* En-tête du tableau */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
              <Text style={[styles.tableHeaderText, styles.colQuantity]}>Qté</Text>
              <Text style={[styles.tableHeaderText, styles.colPrice]}>P.U FCFA</Text>
              <Text style={[styles.tableHeaderText, styles.colTotal]}>Total FCFA</Text>
            </View>

            {/* Lignes des articles */}
            {items.length > 0 ? (
              items.map((item, index) => {
                const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
                return (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.colDescription]}>
                      {item.description || '-'}
                    </Text>
                    <Text style={[styles.tableCell, styles.colQuantity]}>
                      {item.quantity || 0}
                    </Text>
                    <Text style={[styles.tableCell, styles.colPrice]}>
                      {formatNumber(item.unitPrice || 0)}
                    </Text>
                    <Text style={[styles.tableCell, styles.colTotal]}>
                      {formatNumber(itemTotal)}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '100%', textAlign: 'center', fontStyle: 'italic', color: '#666666' }]}>
                  Aucun article
                </Text>
              </View>
            )}
          </View>

          {/* Totaux */}
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT:</Text>
              <Text style={styles.totalValue}>{formatNumber(totalHT)} FCFA</Text>
            </View>
            
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL TTC:</Text>
              <Text style={styles.grandTotalValue}>
                {formatNumber(facture.montantTotal || totalHT)} FCFA
              </Text>
            </View>
          </View>

          {/* Section paiements (uniquement pour factures normales) */}
          {!isProforma && facture.montantPaye > 0 && (
            <View style={styles.paymentSection}>
              <Text style={styles.infoLabel}>ÉTAT DES PAIEMENTS</Text>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Montant payé:</Text>
                <Text style={styles.paymentValue}>{formatNumber(facture.montantPaye || 0)} FCFA</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Montant restant:</Text>
                <Text style={styles.paymentValue}>{formatNumber(facture.montantRestant || 0)} FCFA</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Statut:</Text>
                <Text style={styles.paymentValue}>
                  {(() => {
                    if (facture.status === 'paid') return 'Payé';
                    if (facture.status === 'partial') return 'Partiel';
                    if (facture.status === 'overdue') return 'En retard';
                    return 'En attente';
                  })()}
                </Text>
              </View>
            </View>
          )}

          {/* Note pour proforma */}
          {isProforma && (
            <View style={styles.proformaNote}>
              <Text style={styles.proformaNoteText}>
                Cette facture proforma est établie à titre informatif et ne constitue pas une facture définitive.
                Aucun paiement ne peut être effectué sur ce document.
              </Text>
            </View>
          )}

        </View>

        {/* Cachet en bas à droite (uniquement pour proforma) */}
        {isProforma && cachetImageSrc && (
          <View style={styles.cachetContainer}>
            <Image
              src={cachetImageSrc}
              style={styles.cachetImage}
              cache={false}
            />
          </View>
        )}

        {/* Pied de page */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerTextBold}>
            Riviera palmeraie Lot 09, Ilot 03 Abidjan-Côte d&apos;Ivoire
          </Text>
          <Text style={styles.footerText}>
            +225 05 00 49 58 58 / 07 89 24 47 60 . contact@annour-travel.com
          </Text>
          <Text style={styles.footerText}>
            RCCM : CI-ABJ-03-2023-B13-11981 / NCC : 2304977 U . https://annour-travel.com/
          </Text>
          <Text style={styles.footerTextBold}>
            Orange Money / Wave : 0789244760
          </Text>
          <Text style={styles.footerTextBold}>
            RIB CORIS BANK : 01023   010346524101    14
          </Text>
        </View>
      </Page>
    </Document>
  );
};

FacturePdfDocument.propTypes = {
  facture: PropTypes.object.isRequired,
};

export default FacturePdfDocument;