import React from 'react';
import PropTypes from 'prop-types';
import { Page, Text, View, Font, Image, Document, StyleSheet } from '@react-pdf/renderer';

import { fDate } from 'src/utils/format-time';

import Logo from 'src/assets/logo.jpg';
import { degreeAccademy } from 'src/constants/skill';
import etiquette from 'src/assets/icons/png/etiquette.png';
import { blueColors, borderMaroon } from 'src/styles/colors';
import OpenSansBold from 'src/assets/fonts/Open_Sans/static/OpenSans-Bold.ttf';
import OpenSansLight from 'src/assets/fonts/Open_Sans/static/OpenSans-Light.ttf';
import OpenSansRegular from 'src/assets/fonts/Open_Sans/static/OpenSans-Regular.ttf';

Font.register({
  family: 'Open Sans',
  fonts: [
    { src: OpenSansLight, fontWeight: 300 }, // Light
    { src: OpenSansRegular, fontWeight: 400 }, // Regular
    { src: OpenSansBold, fontWeight: 700 }, // Bold
  ],
});

// Styles du PDF
const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 10, fontFamily: 'Open Sans' },
  section: {
    marginBottom: 10,
    paddingBottom: 2,
    borderBottomColor: borderMaroon,
    borderBottomWidth: 2,
    borderBottomStyle: 'ridge',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  fistDisposation: { flex: 1 },
  secondDisposation: { flex: 2 },
  title: { fontSize: 12, fontWeight: 700 },
  subtitle: { fontSize: 12, fontWeight: 400 },
  simpleText: { fontSize: 10, fontWeight: 300 },
  row: { flexDirection: 'row', marginBottom: 5, display: 'flex' },
  spaceBetween: { alignItems: 'center', justifyContent: 'space-between' },
  center: { alignItems: 'center', justifyContent: 'center' },
  cell: { flex: 1, paddingHorizontal: 5 },
  boxDashed: { border: '1px dashed black', paddingHorizontal: 10, paddingVertical: 5 },
  cellHeader: { flex: 1, fontWeight: 700, paddingHorizontal: 5 },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  logo: { width: 80, height: 80, borderRadius: 20 },
  tag: { width: 10, height: 10, marginRight: 10 },
});

// Composant du CV basé sur le modèle uploadé
const CVDocumentV2 = ({ userData }) => {
  const name = userData.fullName.split(' ')[0];
  const firstName = userData.fullName.substring(userData.fullName.indexOf(' ') + 1);

  // Vérifier le nombre d'expériences et compléter jusqu'à 7
  const filledExperiences = userData.experiences;
  const filledCertifications = [...userData.certificationsOnShore, ...userData.certifications];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Informations personnelles */}
        <View style={{ ...styles.row, ...styles.spaceBetween }}>
          <View style={styles.boxDashed}>
            <Text style={styles.subtitle}>Nom: {name}</Text>
            <Text style={styles.subtitle}>Prénom: {firstName}</Text>
            <Text style={styles.subtitle}>
              Date et lieu de naissance: {fDate(userData.birthDate)} à {userData.birthPlace}
            </Text>
            <Text style={styles.subtitle}>Statut matrimonial et nombre d&apos;enfants:</Text>
            <Text style={styles.subtitle}>Contacts :</Text>
            <Text style={styles.subtitle}>Autre personne à contacter:</Text>
            <Text style={styles.subtitle}>Nationalité: {userData.nationality}</Text>
          </View>
          <Image
            src={{
              uri: `https://api.icmemployment.net/api/v1/admin/profilPicture/${userData.profil}`,
              method: 'GET',
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache',
                Accept: '*/*',
              },
            }}
            style={styles.profileImage}
          />
          <Image src={Logo} style={styles.logo} />
        </View>
        <View style={{ ...styles.row, ...styles.center, width: '100%', marginTop: 10 }}>
          <Text style={{ ...styles.subtitle, textDecoration: 'underline' }}>Domaine :</Text>
        </View>
        <View style={{ ...styles.row, ...styles.center, width: '100%', marginTop: 2 }}>
          {userData.domainsActivity.map((domaine, index) => (
            <Text style={styles.simpleText} key={`domaine_${domaine}`}>
              {domaine}
              {userData.domainsActivity.length > index + 1 && '/ '}
            </Text>
          ))}
        </View>

        {/* Expériences professionnelles */}
        <View style={{ ...styles.row, width: '100%', gap: 15 }}>
          <View style={styles.fistDisposation}>
            <View style={styles.section}>
              <Text style={{ ...styles.title, color: blueColors }}>Derniers diplômes</Text>
            </View>
            <Text style={styles.title}>
              {
                degreeAccademy.find(
                  (degreeItem) =>
                    parseInt(degreeItem.value.split(':')[1], 10) === userData.levelGruaduate
                ).label
              }
            </Text>
            <View style={styles.section}>
              <Text style={{ ...styles.title, color: blueColors }}>Langues (Languages)</Text>
            </View>
            {userData.languages.map(({ title, written, spoken }, index) => (
              <View
                key={`language-${index}`}
                style={{ ...styles.row, alignItems: 'center', justifyContent: 'start' }}
              >
                <Image src={etiquette} style={styles.tag} />
                <Text style={styles.subtitle}>{title} : </Text>
                <Text style={{ ...styles.simpleText, fontSize: 12 }}>{written} (écrit), </Text>
                <Text style={{ ...styles.simpleText, fontSize: 12 }}>{spoken} (oral)</Text>
              </View>
            ))}
            {userData.languages.length > 0 && (
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTopWidth: 1,
                  borderTopColor: 'black',
                  borderTopStyle: 'solid',
                  paddingTop: 3,
                }}
              >
                <Text style={{ ...styles.subtitle, fontSize: 10 }}>A = Très bien</Text>
                <Text style={{ ...styles.subtitle, fontSize: 10 }}>B = Bien</Text>
                <Text style={{ ...styles.subtitle, fontSize: 10 }}>C = Pas du tout</Text>
              </View>
            )}
          </View>
          <View style={styles.secondDisposation}>
            <View style={styles.section}>
              <Text style={{ ...styles.title, color: blueColors }}>Formations (Training)</Text>
            </View>
            {filledCertifications.map(({ certification, expire_at }, index) => (
              <View
                key={`certification-${index}`}
                style={{ ...styles.row, alignItems: 'center', justifyContent: 'start' }}
              >
                <Image src={etiquette} style={styles.tag} />
                <Text style={styles.subtitle}>{certification} : </Text>
                {expire_at && expire_at.length > 0 ? (
                  <Text style={{ ...styles.simpleText, fontSize: 12 }}>{fDate(expire_at)}</Text>
                ) : (
                  <Text />
                )}
              </View>
            ))}
            <View style={styles.section}>
              <Text style={{ ...styles.title, color: blueColors }}>
                Expérience professionnelle (Professional experience)
              </Text>
            </View>
            {filledExperiences.map((exp, index) => (
              <View
                key={`filledExperiences-${index}`}
                style={{
                  ...styles.row,
                  flexWrap: 'wrap',
                  alignItems: 'start',
                  justifyContent: 'start',
                }}
              >
                <Image src={etiquette} style={{ ...styles.tag, marginTop: 5 }} />
                <Text style={styles.subtitle}>
                  {fDate(exp.begin_at)} - {exp.end_at ? fDate(exp.end_at) : 'En cours'} :{' '}
                </Text>
                <Text style={{ ...styles.simpleText, fontSize: 12 }}>À {exp.company} </Text>
                <Text style={{ ...styles.simpleText, fontSize: 12 }}>
                  en tant que {exp.position}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
};

CVDocumentV2.propTypes = {
  userData: PropTypes.object.isRequired,
};

export default CVDocumentV2;
