/* =========================================================================
   CANONICAL AUSTRALIAN SPORT CATALOGUE
   -------------------------------------------------------------------------
   One value, label and icon source for every sport shown in CoachNivo.
   The catalogue prioritises activities reported by the Australian Sports
   Commission and common accredited coaching categories in Australia.

   Icons are tree-shakeable Material Design Icons paths (Apache 2.0). The
   small number of shared glyphs is intentional: related codes such as rugby
   league/union remain visually consistent while their labels disambiguate.
   ========================================================================= */
import {
  mdiBadminton,
  mdiBaseball,
  mdiBasketball,
  mdiBikeFast,
  mdiBowArrow,
  mdiBoxingGlove,
  mdiCircleMultiple,
  mdiCricket,
  mdiDanceBallroom,
  mdiDiving,
  mdiDumbbell,
  mdiFencing,
  mdiFootballAustralian,
  mdiGolf,
  mdiGymnastics,
  mdiHandball,
  mdiHockeySticks,
  mdiHorseHuman,
  mdiKarate,
  mdiKayaking,
  mdiMeditation,
  mdiPolo,
  mdiRacquetball,
  mdiRowing,
  mdiRugby,
  mdiRunFast,
  mdiSailBoat,
  mdiSkateboarding,
  mdiSki,
  mdiSnowboard,
  mdiSoccer,
  mdiSurfing,
  mdiSwim,
  mdiTableTennis,
  mdiTennis,
  mdiTennisBallOutline,
  mdiTerrain,
  mdiTrophyVariant,
  mdiVolleyball,
  mdiWaterPolo,
  mdiWeightLifter,
  mdiYoga,
} from "@mdi/js";

export const SPORT_CATALOG = [
  { name: "AFL", label: "Australian Football (AFL)", icon: mdiFootballAustralian, category: "Team" },
  { name: "Archery", icon: mdiBowArrow, category: "Target" },
  { name: "Athletics", icon: mdiRunFast, category: "Athletics" },
  { name: "Badminton", icon: mdiBadminton, category: "Racquet" },
  { name: "Baseball", icon: mdiBaseball, category: "Team" },
  { name: "Basketball", icon: mdiBasketball, category: "Team" },
  { name: "Bowls", label: "Lawn Bowls", icon: mdiCircleMultiple, category: "Target" },
  { name: "Boxing", icon: mdiBoxingGlove, category: "Combat" },
  { name: "Cricket", icon: mdiCricket, category: "Team" },
  { name: "CrossFit", icon: mdiDumbbell, category: "Fitness" },
  { name: "Cycling", icon: mdiBikeFast, category: "Endurance" },
  { name: "Dance", icon: mdiDanceBallroom, category: "Movement" },
  { name: "Diving", icon: mdiDiving, category: "Aquatic" },
  { name: "Equestrian", icon: mdiHorseHuman, category: "Outdoor" },
  { name: "Fencing", icon: mdiFencing, category: "Combat" },
  { name: "Football", label: "Football (Soccer)", icon: mdiSoccer, category: "Team" },
  { name: "Golf", icon: mdiGolf, category: "Target" },
  { name: "Gymnastics", icon: mdiGymnastics, category: "Movement" },
  { name: "Hockey", icon: mdiHockeySticks, category: "Team" },
  { name: "Kayaking", label: "Canoeing & Kayaking", icon: mdiKayaking, category: "Aquatic" },
  { name: "Martial Arts", icon: mdiKarate, category: "Combat" },
  { name: "Netball", icon: mdiBasketball, customIcon: "netball", category: "Team" },
  { name: "Pickleball", icon: mdiTennisBallOutline, category: "Racquet" },
  { name: "Pilates", icon: mdiMeditation, category: "Fitness" },
  { name: "Polo", icon: mdiPolo, category: "Team" },
  { name: "Rock Climbing", icon: mdiTerrain, category: "Outdoor" },
  { name: "Rowing", icon: mdiRowing, category: "Aquatic" },
  { name: "Rugby League", icon: mdiRugby, category: "Team" },
  { name: "Rugby Union", icon: mdiRugby, category: "Team" },
  { name: "Running", icon: mdiRunFast, category: "Endurance" },
  { name: "Sailing", icon: mdiSailBoat, category: "Aquatic" },
  { name: "Skateboarding", icon: mdiSkateboarding, category: "Action" },
  { name: "Skiing", icon: mdiSki, category: "Snow" },
  { name: "Snowboarding", icon: mdiSnowboard, category: "Snow" },
  { name: "Softball", icon: mdiBaseball, category: "Team" },
  { name: "Squash", icon: mdiRacquetball, category: "Racquet" },
  { name: "Strength & Conditioning", icon: mdiWeightLifter, category: "Fitness" },
  { name: "Surfing", icon: mdiSurfing, category: "Aquatic" },
  { name: "Swimming", icon: mdiSwim, category: "Aquatic" },
  { name: "Table Tennis", icon: mdiTableTennis, category: "Racquet" },
  { name: "Tennis", icon: mdiTennis, category: "Racquet" },
  { name: "Touch Football", icon: mdiHandball, category: "Team" },
  { name: "Triathlon", icon: mdiBikeFast, category: "Endurance" },
  { name: "Volleyball", icon: mdiVolleyball, category: "Team" },
  { name: "Water Polo", icon: mdiWaterPolo, category: "Aquatic" },
  { name: "Yoga", icon: mdiYoga, category: "Fitness" },
];

export const SPORT_NAMES = SPORT_CATALOG.map((sport) => sport.name);

// First-run discovery choices: broad enough for Australia without turning
// the quick filter into a wall of options. The full catalogue stays searchable.
export const POPULAR_SPORTS = [
  "Football", "Swimming", "Basketball", "Netball", "AFL", "Tennis",
  "Cricket", "Athletics", "Rugby League", "Badminton", "Volleyball",
  "Cycling", "Golf", "Gymnastics", "Surfing", "Running",
];

const SPORT_ALIASES = {
  soccer: "Football",
  "football (soccer)": "Football",
  "australian football": "AFL",
  "australian rules football": "AFL",
  "australian football (afl)": "AFL",
  "strength and conditioning": "Strength & Conditioning",
  "s&c": "Strength & Conditioning",
  canoeing: "Kayaking",
  "canoeing & kayaking": "Kayaking",
  "lawn bowls": "Bowls",
};

const SPORT_BY_NAME = new Map(SPORT_CATALOG.map((sport) => [sport.name.toLowerCase(), sport]));

export function getSportDefinition(value) {
  const key = String(value || "").trim().toLowerCase();
  const canonical = SPORT_ALIASES[key] || value;
  return SPORT_BY_NAME.get(String(canonical || "").trim().toLowerCase()) || {
    name: value || "Sport",
    label: value || "Sport",
    icon: mdiTrophyVariant,
    category: "Sport",
  };
}

export function getSportLabel(value) {
  const sport = getSportDefinition(value);
  return sport.label || sport.name;
}

export function getSportIconPath(value) {
  return getSportDefinition(value).icon;
}
