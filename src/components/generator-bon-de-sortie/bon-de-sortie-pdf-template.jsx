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
  watermark: {
    width: 350,
    height: 'auto',
    opacity: 0.12,
  },
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
  content: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 60,
    position: 'relative',
    zIndex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 8,
    color: '#000000',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 400,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
    color: '#000000',
    borderBottom: '1px solid #000000',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
    fontSize: 9,
  },
  label: {
    width: '40%',
    fontWeight: 600,
    color: '#333333',
  },
  value: {
    width: '60%',
    color: '#000000',
  },
  descriptionBox: {
    marginTop: 10,
    padding: 10,
    border: '1px solid #cccccc',
    borderRadius: 4,
    backgroundColor: '#f9f9f9',
  },
  descriptionText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#000000',
  },
  amountBox: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    border: '2px solid #000000',
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 5,
    color: '#333333',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 700,
    color: '#000000',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    paddingTop: 10,
    borderTop: '1px solid #cccccc',
    fontSize: 8,
    color: '#666666',
    textAlign: 'center',
  },
});

const CATEGORIES = {
  frais_generaux: 'Frais généraux',
  salaires: 'Salaires',
  fournitures: 'Fournitures',
  transport: 'Transport',
  communication: 'Communication',
  marketing: 'Marketing',
  location: 'Location',
  maintenance: 'Maintenance',
  autre: 'Autre',
};

const METHODES = {
  cash: 'Espèces',
  bank_transfer: 'Virement bancaire',
  check: 'Chèque',
  mobile_money: 'Mobile Money',
  card: 'Carte bancaire',
  other: 'Autre',
};

const STATUS = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
  completed: 'Complété',
};

const BonDeSortiePdfDocument = ({ bon }) => {
  if (!bon) return null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Filigrane */}
        {bon._watermarkLogo && (
          <View style={styles.watermarkContainer}>
            <Image src={bon._watermarkLogo} style={styles.watermark} />
          </View>
        )}

        {/* En-tête */}
        {bon._headerImage && (
          <View style={styles.header}>
            <Image src={bon._headerImage} style={styles.headerImage} />
          </View>
        )}

        {/* Contenu */}
        <View style={styles.content}>
          <Text style={styles.title}>BON DE SORTIE</Text>
          <Text style={styles.subtitle}>N° {bon.numeroBon || bon.id}</Text>

          {/* Informations du bon */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Numéro:</Text>
              <Text style={styles.value}>{bon.numeroBon || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Date:</Text>
              <Text style={styles.value}>{bon.dateBon ? fDate(bon.dateBon) : '-'}</Text>
            </View>
            {bon.dateApprobation && (
              <View style={styles.row}>
                <Text style={styles.label}>Date d&apos;approbation:</Text>
                <Text style={styles.value}>{fDate(bon.dateApprobation)}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>Statut:</Text>
              <Text style={styles.value}>{STATUS[bon.status] || bon.status}</Text>
            </View>
          </View>

          {/* Détails */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Détails</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Catégorie:</Text>
              <Text style={styles.value}>{CATEGORIES[bon.categorie] || bon.categorie}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Méthode de paiement:</Text>
              <Text style={styles.value}>{METHODES[bon.methode] || bon.methode}</Text>
            </View>
            {bon.reference && (
              <View style={styles.row}>
                <Text style={styles.label}>Référence:</Text>
                <Text style={styles.value}>{bon.reference}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          {bon.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>{bon.description}</Text>
              </View>
            </View>
          )}

          {/* Montant */}
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Montant total</Text>
            <Text style={styles.amountValue}>{formatNumber(bon.montant || 0)} FCFA</Text>
          </View>

          {/* Créé par */}
          {bon.createdBy && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informations de création</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Créé par:</Text>
                <Text style={styles.value}>
                  {`${bon.createdBy.firstname || ''} ${bon.createdBy.lastname || ''}`.trim() ||
                    bon.createdBy.email ||
                    '-'}
                </Text>
              </View>
              {bon.createdAt && (
                <View style={styles.row}>
                  <Text style={styles.label}>Date de création:</Text>
                  <Text style={styles.value}>{fDate(bon.createdAt)}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Pied de page */}
        <View style={styles.footer}>
          <Text>Document généré le {fDate(new Date())}</Text>
        </View>
      </Page>
    </Document>
  );
};

BonDeSortiePdfDocument.propTypes = {
  bon: PropTypes.object.isRequired,
};

export default BonDeSortiePdfDocument;

