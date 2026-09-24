import { SPORT_NAMES } from "./sports";

/* =========================================================================
   FORM OPTION LISTS
   -------------------------------------------------------------------------
   Dropdown / select / multi-select options used by onboarding, profile
   edit, and filter screens. Separated from entity data so form screens
   can import these without pulling in the full coach/booking datasets.
   ========================================================================= */

export const LANGUAGE_OPTIONS = [
  "English", "Mandarin", "Cantonese", "Vietnamese", "Arabic", "Hindi", "Punjabi",
  "Spanish", "Italian", "Greek", "Korean", "Japanese", "French", "German",
  "Tagalog", "Thai", "Indonesian", "Portuguese", "Russian", "Swedish", "Turkish", "Auslan",
];

export const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];

export const AU_SUBURBS = [
  // Sydney / NSW
  { suburb: "Sydney CBD", state: "NSW", postcode: "2000", lat: -33.8688, lng: 151.2093 },
  { suburb: "Surry Hills", state: "NSW", postcode: "2010", lat: -33.8865, lng: 151.2095 },
  { suburb: "Darlinghurst", state: "NSW", postcode: "2010", lat: -33.8780, lng: 151.2180 },
  { suburb: "Paddington", state: "NSW", postcode: "2021", lat: -33.8840, lng: 151.2260 },
  { suburb: "Double Bay", state: "NSW", postcode: "2028", lat: -33.8760, lng: 151.2430 },
  { suburb: "Bondi", state: "NSW", postcode: "2026", lat: -33.8915, lng: 151.2765 },
  { suburb: "Bondi Beach", state: "NSW", postcode: "2026", lat: -33.8910, lng: 151.2770 },
  { suburb: "Coogee", state: "NSW", postcode: "2034", lat: -33.9210, lng: 151.2560 },
  { suburb: "Randwick", state: "NSW", postcode: "2031", lat: -33.9167, lng: 151.2417 },
  { suburb: "Redfern", state: "NSW", postcode: "2016", lat: -33.8930, lng: 151.2044 },
  { suburb: "Waterloo", state: "NSW", postcode: "2017", lat: -33.8990, lng: 151.2070 },
  { suburb: "Alexandria", state: "NSW", postcode: "2015", lat: -33.9050, lng: 151.1960 },
  { suburb: "Newtown", state: "NSW", postcode: "2042", lat: -33.8980, lng: 151.1795 },
  { suburb: "Glebe", state: "NSW", postcode: "2037", lat: -33.8795, lng: 151.1852 },
  { suburb: "Pyrmont", state: "NSW", postcode: "2009", lat: -33.8690, lng: 151.1940 },
  { suburb: "Balmain", state: "NSW", postcode: "2041", lat: -33.8580, lng: 151.1780 },
  { suburb: "Rozelle", state: "NSW", postcode: "2039", lat: -33.8640, lng: 151.1710 },
  { suburb: "Mosman", state: "NSW", postcode: "2088", lat: -33.8290, lng: 151.2440 },
  { suburb: "Chatswood", state: "NSW", postcode: "2067", lat: -33.7969, lng: 151.1830 },
  { suburb: "Lane Cove", state: "NSW", postcode: "2066", lat: -33.8150, lng: 151.1680 },
  { suburb: "Manly", state: "NSW", postcode: "2095", lat: -33.7980, lng: 151.2885 },
  { suburb: "Parramatta", state: "NSW", postcode: "2150", lat: -33.8150, lng: 151.0011 },
  { suburb: "Cronulla", state: "NSW", postcode: "2230", lat: -34.0560, lng: 151.1530 },

  // Melbourne / VIC
  { suburb: "Fitzroy", state: "VIC", postcode: "3065", lat: -37.8015, lng: 144.9780 },
  { suburb: "Collingwood", state: "VIC", postcode: "3066", lat: -37.8020, lng: 144.9880 },
  { suburb: "Richmond", state: "VIC", postcode: "3121", lat: -37.8230, lng: 144.9985 },
  { suburb: "Carlton", state: "VIC", postcode: "3053", lat: -37.8000, lng: 144.9650 },
  { suburb: "North Melbourne", state: "VIC", postcode: "3051", lat: -37.7980, lng: 144.9440 },
  { suburb: "Docklands", state: "VIC", postcode: "3008", lat: -37.8180, lng: 144.9450 },
  { suburb: "South Yarra", state: "VIC", postcode: "3141", lat: -37.8380, lng: 144.9910 },
  { suburb: "Prahran", state: "VIC", postcode: "3181", lat: -37.8500, lng: 144.9980 },
  { suburb: "St Kilda", state: "VIC", postcode: "3182", lat: -37.8675, lng: 144.9780 },
  { suburb: "Brunswick", state: "VIC", postcode: "3056", lat: -37.7670, lng: 144.9620 },
  { suburb: "Hawthorn", state: "VIC", postcode: "3122", lat: -37.8220, lng: 145.0340 },
  { suburb: "Geelong", state: "VIC", postcode: "3220", lat: -38.1499, lng: 144.3617 },

  // QLD
  { suburb: "South Brisbane", state: "QLD", postcode: "4101", lat: -27.4825, lng: 153.0160 },
  { suburb: "Fortitude Valley", state: "QLD", postcode: "4006", lat: -27.4560, lng: 153.0350 },
  { suburb: "New Farm", state: "QLD", postcode: "4005", lat: -27.4660, lng: 153.0470 },
  { suburb: "Surfers Paradise", state: "QLD", postcode: "4217", lat: -28.0020, lng: 153.4290 },
  { suburb: "Broadbeach", state: "QLD", postcode: "4218", lat: -28.0260, lng: 153.4310 },
  { suburb: "Robina", state: "QLD", postcode: "4226", lat: -28.0730, lng: 153.3830 },
  { suburb: "Burleigh Heads", state: "QLD", postcode: "4220", lat: -28.1000, lng: 153.4480 },
  { suburb: "Southport", state: "QLD", postcode: "4215", lat: -27.9670, lng: 153.4000 },

  // SA
  { suburb: "North Adelaide", state: "SA", postcode: "5006", lat: -34.9060, lng: 138.5930 },
  { suburb: "Glenelg", state: "SA", postcode: "5045", lat: -34.9810, lng: 138.5160 },

  // WA
  { suburb: "Fremantle", state: "WA", postcode: "6160", lat: -32.0560, lng: 115.7480 },
  { suburb: "Subiaco", state: "WA", postcode: "6008", lat: -31.9490, lng: 115.8260 },
  { suburb: "Perth", state: "WA", postcode: "6000", lat: -31.9523, lng: 115.8613 },

  // TAS
  { suburb: "Hobart", state: "TAS", postcode: "7000", lat: -42.8821, lng: 147.3272 },
  { suburb: "North Hobart", state: "TAS", postcode: "7000", lat: -42.8750, lng: 147.3150 },

  // ACT & NT
  { suburb: "Canberra", state: "ACT", postcode: "2600", lat: -35.2809, lng: 149.1300 },
  { suburb: "Braddon", state: "ACT", postcode: "2612", lat: -35.2710, lng: 149.1340 },
  { suburb: "Darwin", state: "NT", postcode: "0800", lat: -12.4634, lng: 130.8456 },
];

export const SPORT_OPTIONS_FULL = SPORT_NAMES;

export const COACHING_CATEGORY_OPTIONS = [
  "1-on-1 private coaching",
  "Small group sessions",
  "Team coaching",
  "Squad / program training",
  "Online coaching",
  "Corporate / school programs",
  "Family sessions",
  "Junior development academy",
];

export const SKILL_LEVEL_OPTIONS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Elite / competitive",
];

export const AGE_GROUP_OPTIONS = [
  "Under 12",
  "13–17",
  "18–24",
  "25–40",
  "40+",
];

export const COACHING_EXPERIENCE_LEVELS = [
  "Less than 1 year",
  "1–3 years",
  "3–5 years",
  "5–10 years",
  "10+ years",
];

export const COACHING_FORMAT_OPTIONS = [
  "In person",
  "Online / virtual",
  "Hybrid",
];

export const ID_TYPE_OPTIONS = [
  "Driver licence",
  "Passport",
  "Proof of age card",
];

export const CERTIFICATION_TYPE_OPTIONS = [
  "Coaching accreditation",
  "First Aid",
  "CPR",
  "Sport-specific certification",
  "Strength & Conditioning (ASCA)",
  "Other",
];
