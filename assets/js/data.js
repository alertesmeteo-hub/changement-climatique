/*
 * Données climatiques régionales — trajectoire TRACC (Météo-France).
 * Référence 1976-2005. Horizons 2050 (+2,7 °C national) et 2100 (+4 °C national).
 * Chaque région pointe vers la page officielle Météo-France dont les chiffres
 * ont été repris (voir `source`). Valeur `null` = non publiée par la source.
 */
const REGIONS = {
  "11": {
    nom: "Île-de-France",
    source: "https://meteofrance.com/le-changement-climatique/quel-climat-futur-en-ile-de-france",
    tempAnnuelle: { 2050: 1.9, 2100: 3.2 },
    chaleur: { joursGe35: { ref: 0.5, 2050: 4, 2100: 8.4 }, nuitsChaudes: { ref: 2, 2050: 10, 2100: 21 } },
    secheresse: { joursSolSec: { ref: 118, 2050: 139, 2100: 151 }, pluieEte: { 2050: -5, 2100: -13 } },
    feux: { joursDanger: { ref: 1.6, 2050: 7, 2100: 8.6 } },
    pluies: { intensite: { 2050: 10, 2100: 20 } }
  },
  "24": {
    nom: "Centre-Val de Loire",
    source: "https://meteofrance.com/changement-climatique/quel-climat-futur-en-centre-val-de-loire",
    tempAnnuelle: { 2050: 2.0, 2100: 3.3 },
    chaleur: { joursGe35: { ref: 0.5, 2050: 4, 2100: 10 }, nuitsChaudes: { ref: 3, 2050: 13, 2100: 26 } },
    secheresse: { joursSolSec: { ref: 118, 2050: 140, 2100: 153 }, pluieEte: { 2050: -6, 2100: -18 } },
    feux: { joursDanger: { ref: 2, 2050: 7, 2100: 12 } },
    pluies: { intensite: { 2050: 13, 2100: 18 } }
  },
  "27": {
    nom: "Bourgogne-Franche-Comté",
    source: "https://meteofrance.com/changement-climatique/quel-climat-futur-en-bourgogne-franche-comte",
    tempAnnuelle: { 2050: 2.2, 2100: 3.5 },
    chaleur: { joursGe35: { ref: 0.5, 2050: 4, 2100: 10 }, nuitsChaudes: { ref: 2, 2050: 12, 2100: 25 } },
    secheresse: { joursSolSec: { ref: 64, 2050: 91, 2100: 106 }, pluieEte: { 2050: -6, 2100: -17 } },
    feux: { joursDanger: { ref: null, 2050: 3, 2100: 7 } },
    pluies: { intensite: { 2050: 10, 2100: 19 } }
  },
  "28": {
    nom: "Normandie",
    source: "https://meteofrance.com/changement-climatique/quel-climat-futur-en-normandie",
    tempAnnuelle: { 2050: 1.8, 2100: 2.9 },
    chaleur: { joursGe35: { ref: 0.2, 2050: 1.3, 2100: 2.6 }, nuitsChaudes: { ref: null, 2050: 4, 2100: 9 } },
    secheresse: { joursSolSec: { ref: 106, 2050: 122, 2100: 137 }, pluieEte: { 2050: -6, 2100: -20 } },
    feux: { joursDanger: { ref: 0.3, 2050: 1.6, 2100: null } },
    pluies: { intensite: { 2050: 9, 2100: 18 } }
  },
  "32": {
    nom: "Hauts-de-France",
    source: "https://meteofrance.com/le-changement-climatique/quel-climat-futur/quel-climat-futur-dans-les-hauts-de-france",
    tempAnnuelle: { 2050: 1.9, 2100: 3.0 },
    chaleur: { joursGe35: { ref: 0.2, 2050: 1.5, 2100: 3 }, nuitsChaudes: { ref: 1, 2050: 5, 2100: 10 } },
    secheresse: { joursSolSec: { ref: null, 2050: 113, 2100: 122 }, pluieEte: { 2050: -6, 2100: -14 } },
    feux: { joursDanger: { ref: 0.5, 2050: 3, 2100: 4 } },
    pluies: { intensite: { 2050: 12, 2100: 17 } }
  },
  "44": {
    nom: "Grand Est",
    source: "https://meteofrance.com/changement-climatique/quel-climat-futur-dans-le-grand-est",
    tempAnnuelle: { 2050: 2.1, 2100: 3.3 },
    chaleur: { joursGe35: { ref: 0.3, 2050: 3, 2100: 7 }, nuitsChaudes: { ref: 2, 2050: 10, 2100: 20 } },
    secheresse: { joursSolSec: { ref: 72, 2050: null, 2100: 107 }, pluieEte: { 2050: -3, 2100: -13 } },
    feux: { joursDanger: { ref: null, 2050: 3.8, 2100: 4.6 } },
    pluies: { intensite: { 2050: 13, 2100: 28 } }
  },
  "52": {
    nom: "Pays de la Loire",
    source: "https://meteofrance.com/changement-climatique/quel-climat-futur-dans-les-pays-de-la-loire",
    tempAnnuelle: { 2050: 2.0, 2100: 3.0 },
    chaleur: { joursGe35: { ref: 0.5, 2050: 3.6, 2100: 7 }, nuitsChaudes: { ref: 2, 2050: 12, 2100: 24 } },
    secheresse: { joursSolSec: { ref: null, 2050: 157, 2100: null }, pluieEte: { 2050: -7, 2100: -23 } },
    feux: { joursDanger: { ref: 2.8, 2050: 7.6, 2100: null } },
    pluies: { intensite: { 2050: 12, 2100: 17 } }
  },
  "53": {
    nom: "Bretagne",
    source: "https://meteofrance.com/changement-climatique/quel-climat-futur-en-bretagne",
    tempAnnuelle: { 2050: 1.8, 2100: 2.9 },
    chaleur: { joursGe35: { ref: 0.1, 2050: 1.2, 2100: 2.5 }, nuitsChaudes: { ref: null, 2050: 4, 2100: 8 } },
    secheresse: { joursSolSec: { ref: 124, 2050: 140, 2100: 152 }, pluieEte: { 2050: -11, 2100: -26 } },
    feux: { joursDanger: { ref: 0.5, 2050: 2, 2100: 4.5 } },
    pluies: { intensite: { 2050: 10, 2100: null } }
  },
  "75": {
    nom: "Nouvelle-Aquitaine",
    source: "https://meteofrance.com/changement-climatique/quel-climat-futur-en-nouvelle-aquitaine",
    tempAnnuelle: { 2050: 2.1, 2100: 3.4 },
    chaleur: { joursGe35: { ref: 0.8, 2050: 5, 2100: 11 }, nuitsChaudes: { ref: 4, 2050: 19, 2100: 34 } },
    secheresse: { joursSolSec: { ref: 99, 2050: 124, 2100: 148 }, pluieEte: { 2050: -12, 2100: -29 } },
    feux: { joursDanger: { ref: 1, 2050: 4, 2100: 7 } },
    pluies: { intensite: { 2050: 11, 2100: 15 } }
  },
  "76": {
    nom: "Occitanie",
    source: "https://meteofrance.com/changement-climatique/quel-climat-futur-en-occitanie",
    tempAnnuelle: { 2050: 2.2, 2100: 3.5 },
    chaleur: { joursGe35: { ref: 1, 2050: 7.7, 2100: 17.8 }, nuitsChaudes: { ref: null, 2050: null, 2100: null } },
    secheresse: { joursSolSec: { ref: 93, 2050: 126, 2100: 151 }, pluieEte: { 2050: -15, 2100: -24 } },
    feux: { joursDanger: { ref: 2.5, 2050: 6.7, 2100: 13.4 } },
    pluies: { intensite: { 2050: 8, 2100: 13 } }
  },
  "84": {
    nom: "Auvergne-Rhône-Alpes",
    source: "https://meteofrance.com/changement-climatique/quel-climat-futur-en-auvergne-rhone-alpes",
    tempAnnuelle: { 2050: 2.3, 2100: 3.7 },
    chaleur: { joursGe35: { ref: 0.5, 2050: 4, 2100: 10 }, nuitsChaudes: { ref: 1, 2050: 11, 2100: 24 } },
    secheresse: { joursSolSec: { ref: 51, 2050: 82, 2100: 107 }, pluieEte: { 2050: -7, 2100: -21 } },
    feux: { joursDanger: { ref: null, 2050: 3, 2100: 6 } },
    pluies: { intensite: { 2050: 11, 2100: 12 } }
  },
  "93": {
    nom: "Provence-Alpes-Côte d'Azur",
    source: "https://meteofrance.com/changement-climatique/quel-climat-futur-en-provence-alpes-cote-dazur",
    tempAnnuelle: { 2050: 2.2, 2100: 3.7 },
    chaleur: { joursGe35: { ref: 0.2, 2050: 4, 2100: 11 }, nuitsChaudes: { ref: 4, 2050: 23, 2100: 48 } },
    secheresse: { joursSolSec: { ref: 101, 2050: 130, 2100: 156 }, pluieEte: { 2050: -10, 2100: -18 } },
    feux: { joursDanger: { ref: 9.1, 2050: 18, 2100: 31 } },
    pluies: { intensite: { 2050: 5, 2100: 9 } }
  },
  "94": {
    nom: "Corse",
    source: "https://meteofrance.com/changement-climatique/quel-climat-futur-en-corse",
    tempAnnuelle: { 2050: 2.1, 2100: 3.5 },
    chaleur: { joursGe35: { ref: 0.8, 2050: 4, 2100: 8 }, nuitsChaudes: { ref: null, 2050: 10, 2100: 21 } },
    secheresse: { joursSolSec: { ref: 118, 2050: 139, 2100: 150 }, pluieEte: { 2050: -5, 2100: -13 } },
    feux: { joursDanger: { ref: null, 2050: 7, 2100: 8 } },
    pluies: { intensite: { 2050: 10, 2100: 19 } }
  }
};

/* Chiffres nationaux (Météo-France, TRACC) pour les pages d'accueil / méthode. */
const NATIONAL = {
  source: "https://meteofrance.com/changement-climatique/quel-climat-futur",
  tempAnnuelle: { 2050: 2.0, 2100: 3.0 },
  tempEte: { 2050: 2.4, 2100: 4.0 },
  joursSolSec: { 2100: 122 },
  pluieEte: { 2100: -20 },
  pluieHiver: { 2100: 27 }
};

/* Définition des 4 modules / aléas. */
const HAZARDS = {
  chaleur: {
    label: "Chaleur",
    color: "#e2483d",
    unit: "j/an",
    metric: "joursGe35",
    metricLabel: "Jours à 35 °C ou plus",
    group: "chaleur",
    description: "Nombre de jours par an où la température maximale atteint 35 °C ou plus, et nombre de nuits « chaudes » (minimale supérieure à 20 °C)."
  },
  secheresse: {
    label: "Sécheresse",
    color: "#c9862f",
    unit: "j/an",
    metric: "joursSolSec",
    metricLabel: "Jours de sol sec",
    group: "secheresse",
    description: "Nombre de jours par an où l'humidité du sol est déficitaire, et évolution du cumul de pluie en été (juin à août)."
  },
  "feux-de-foret": {
    label: "Feux de forêt",
    color: "#f2994a",
    unit: "j/an",
    metric: "joursDanger",
    metricLabel: "Jours de danger météo élevé",
    group: "feux",
    description: "Nombre de jours par an où les conditions météo (chaleur, sécheresse, vent) rendent le danger de feu de forêt élevé."
  },
  "pluies-extremes": {
    label: "Pluies extrêmes",
    color: "#2f80ed",
    unit: "%",
    metric: "intensite",
    metricLabel: "Intensité des pluies fortes",
    group: "pluies",
    description: "Évolution de l'intensité des précipitations les plus fortes de l'année, par rapport à la période de référence 1976-2005."
  }
};
