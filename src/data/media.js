/* =========================================================================
   LOCAL PROFILE & MEDIA ASSETS
   -------------------------------------------------------------------------
   Public assets are deliberately used as first-party prototype content so
   profile cards, galleries and the reels viewer feel populated from launch.
   ========================================================================= */

const asset = (path) => `/${path.replaceAll(" ", "%20")}`;

// Valid avatar asset file numbers present in public/avatars/
const VALID_AVATAR_NUMS = [
  1, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
  31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45,
  46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56,
];

export const getValidAvatar = (index) => {
  const num = VALID_AVATAR_NUMS[Math.abs(index) % VALID_AVATAR_NUMS.length];
  return asset(`avatars/avatar (${num}).webp`);
};

export const COACH_AVATARS = {
  c1: getValidAvatar(0),
  c2: getValidAvatar(1),
  c3: getValidAvatar(2),
  c4: getValidAvatar(3),
  c5: getValidAvatar(4),
  c6: getValidAvatar(5),
  c7: getValidAvatar(6),
  c8: getValidAvatar(7),
  c9: getValidAvatar(8),
  c10: getValidAvatar(9),
  c11: getValidAvatar(10),
  c12: getValidAvatar(11),
  c13: getValidAvatar(12),
  c14: getValidAvatar(13),
  c15: getValidAvatar(14),
  c16: getValidAvatar(15),
  c17: getValidAvatar(16),
  c18: getValidAvatar(17),
  c19: getValidAvatar(18),
  c20: getValidAvatar(19),
  c21: getValidAvatar(20),
  c22: getValidAvatar(21),
  c23: getValidAvatar(22),
  c24: getValidAvatar(23),
  c25: getValidAvatar(24),
  c26: getValidAvatar(25),
  c27: getValidAvatar(26),
  c28: getValidAvatar(27),
  c29: getValidAvatar(28),
  c30: getValidAvatar(29),
  c31: getValidAvatar(30),
  c32: getValidAvatar(31),
  c33: getValidAvatar(32),
  c34: getValidAvatar(33),
  c35: getValidAvatar(34),
  c36: getValidAvatar(35),
  c37: getValidAvatar(36),
  c38: getValidAvatar(37),
  c39: getValidAvatar(38),
  c40: getValidAvatar(39),
  c41: getValidAvatar(40),
  c42: getValidAvatar(41),
  c43: getValidAvatar(42),
  c44: getValidAvatar(43),
  c45: getValidAvatar(44),
  c46: getValidAvatar(45),
  c47: getValidAvatar(46),
  c48: getValidAvatar(47),
  c49: getValidAvatar(48),
  c50: getValidAvatar(49),
  c51: getValidAvatar(50),
  c52: getValidAvatar(51),
  c53: getValidAvatar(52),
  c54: getValidAvatar(53),
  c55: getValidAvatar(54),
  c56: getValidAvatar(55),
};

export const PROFILE_AVATARS = {
  "new coach": asset("avatar-1.webp"),
  "isla ferguson": COACH_AVATARS.c1,
  "isla f.": COACH_AVATARS.c1,
  "@isla.netball": COACH_AVATARS.c1,
  "noah kelly": COACH_AVATARS.c2,
  "noah k.": COACH_AVATARS.c2,
  "@noah.kelly": COACH_AVATARS.c2,
  "ruby hendricks": COACH_AVATARS.c3,
  "ruby h.": COACH_AVATARS.c3,
  "@ruby.waves": COACH_AVATARS.c3,
  "marcus ude": COACH_AVATARS.c4,
  "@marcus.boxes": COACH_AVATARS.c4,
  "marcus u.": COACH_AVATARS.c4,
  "chloe dawson": COACH_AVATARS.c5,
  "chloe d.": COACH_AVATARS.c5,
  "@chloe.swing": COACH_AVATARS.c5,
  "liam o'connor": COACH_AVATARS.c6,
  "liam o.": COACH_AVATARS.c6,
  "@liam.rides": COACH_AVATARS.c6,
  "priya sharma": COACH_AVATARS.c7,
  "priya s.": COACH_AVATARS.c7,
  "@priya.tennis": COACH_AVATARS.c7,
  "declan murphy": COACH_AVATARS.c8,
  "declan m.": COACH_AVATARS.c8,
  "@declan.afl": COACH_AVATARS.c8,
  "elena rostova": COACH_AVATARS.c9,
  "elena r.": COACH_AVATARS.c9,
  "@elena.mobility": COACH_AVATARS.c9,
  "tyler koa henderson": COACH_AVATARS.c10,
  "koa henderson": COACH_AVATARS.c10,
  "koa h.": COACH_AVATARS.c10,
  "@koa.swim": COACH_AVATARS.c10,
  "maya chen": COACH_AVATARS.c11,
  "maya c.": COACH_AVATARS.c11,
  "@maya.shuttle": COACH_AVATARS.c11,
  "samuel thorne": COACH_AVATARS.c12,
  "samuel t.": COACH_AVATARS.c12,
  "@sam.hoops": COACH_AVATARS.c12,
  "aisha al-mansoor": COACH_AVATARS.c13,
  "aisha a.": COACH_AVATARS.c13,
  "@aisha.stride": COACH_AVATARS.c13,
  "jackson reed": COACH_AVATARS.c14,
  "jackson r.": COACH_AVATARS.c14,
  "@jackson.bjj": COACH_AVATARS.c14,
  "charlotte hayes": COACH_AVATARS.c15,
  "lottie hayes": COACH_AVATARS.c15,
  "lottie h.": COACH_AVATARS.c15,
  "@lottie.rowing": COACH_AVATARS.c15,
  "darcy vance": COACH_AVATARS.c16,
  "darcy v.": COACH_AVATARS.c16,
  "@darcy.football": COACH_AVATARS.c16,
  "sienna bennett": COACH_AVATARS.c17,
  "ethan zhao": COACH_AVATARS.c18,
  "callum brooks": COACH_AVATARS.c19,
  "mia vasilev": COACH_AVATARS.c20,
  "jordan walsh": COACH_AVATARS.c21,
  "tara gallagher": COACH_AVATARS.c22,
  "xavier dupont": COACH_AVATARS.c23,
  "jasmine kaur": COACH_AVATARS.c24,
  "lucas silva": COACH_AVATARS.c25,
  "zoe campbell": COACH_AVATARS.c26,
  "nathanial king": COACH_AVATARS.c27,
  "nate king": COACH_AVATARS.c27,
  "harper lee": COACH_AVATARS.c28,
  "dominic rossi": COACH_AVATARS.c29,
  "keira walsh": COACH_AVATARS.c30,
  "benjamin scott": COACH_AVATARS.c31,
  "ava mitchell": COACH_AVATARS.c32,
  "ryan o'reilly": COACH_AVATARS.c33,
  "sophia papadakis": COACH_AVATARS.c34,
  "leo zhang": COACH_AVATARS.c35,
  "annabelle cross": COACH_AVATARS.c36,
  "hugo mercier": COACH_AVATARS.c37,
  "chelsea wright": COACH_AVATARS.c38,
  "oliver vance": COACH_AVATARS.c39,
  "freya lindqvist": COACH_AVATARS.c40,
  "lachlan reid": COACH_AVATARS.c41,
  "scarlett zhang": COACH_AVATARS.c42,
  "toby henderson": COACH_AVATARS.c43,
  "matilda green": COACH_AVATARS.c44,
  "angus macleod": COACH_AVATARS.c45,
  "billie evans": COACH_AVATARS.c46,
  "damian cruz": COACH_AVATARS.c47,
  "victoria sterling": COACH_AVATARS.c48,
  "zane parker": COACH_AVATARS.c49,
  "kayla thompson": COACH_AVATARS.c50,

  // Clients & Client Handles
  "sarah lin": getValidAvatar(17),
  "sarah l.": getValidAvatar(17),
  "sarah": getValidAvatar(17),
  "@sarahlin": getValidAvatar(17),
  "marcus webb": getValidAvatar(18),
  "marcus w.": getValidAvatar(18),
  "marcus": getValidAvatar(18),
  "@marcusw": getValidAvatar(18),
  "@marcuswebb": getValidAvatar(18),
  "the chen family (u18)": getValidAvatar(19),
  "the chen family": getValidAvatar(19),
  "the chens": getValidAvatar(19),
  "@thechens": getValidAvatar(19),
  "aiden cross": getValidAvatar(20),
  "aiden c.": getValidAvatar(20),
  "aiden": getValidAvatar(20),
  "@aidenruns": getValidAvatar(20),
  "grace liu": getValidAvatar(21),
  "grace l.": getValidAvatar(21),
  "grace": getValidAvatar(21),
  "@graceliu": getValidAvatar(21),
  "ravi patel": getValidAvatar(22),
  "ravi p.": getValidAvatar(22),
  "ravi": getValidAvatar(22),
  "@ravip": getValidAvatar(22),
  "owen king": getValidAvatar(23),
  "owen k.": getValidAvatar(23),
  "owen": getValidAvatar(23),
  "@owenk": getValidAvatar(23),
  "the nguyen family (u18)": getValidAvatar(24),
  "the nguyen family": getValidAvatar(24),
  "the nguyens": getValidAvatar(24),
  "@nguyenfam": getValidAvatar(24),
  "priya desai": getValidAvatar(25),
  "priya d.": getValidAvatar(25),
  "@priyad": getValidAvatar(25),
  "alex morgan": getValidAvatar(26),
  "alex m.": getValidAvatar(26),
  "@alexm": getValidAvatar(26),
  "@alexmorgan": getValidAvatar(26),
  "jordan lee": getValidAvatar(27),
  "jordan l.": getValidAvatar(27),
  "@jordanl": getValidAvatar(27),
  "@jordanlee": getValidAvatar(27),
  "hannah smith": getValidAvatar(0),
  "hannah s.": getValidAvatar(0),
  "@hannahs": getValidAvatar(0),
  "leo tanaka": getValidAvatar(28),
  "leo t.": getValidAvatar(28),
  "@leot": getValidAvatar(28),
  "child": getValidAvatar(29),
  "you": getValidAvatar(17),
  "me": getValidAvatar(17),
  "client": getValidAvatar(17),
  "new client": getValidAvatar(17),
};

const reel = (number) => asset(`reels/coach_reel (${number}).mp4`);
const photo = (number) => asset(`media/coach (${number}).webp`);
const item = (id, type, url, caption, sport) => ({ id, type, url, caption, sport });

const REEL_CAPTIONS = [
  "Technique in motion",
  "Building confident movement",
  "Session highlight",
  "Training with purpose",
  "Game-day preparation",
  "Progress, one session at a time",
  "Focused coaching in action",
  "A stronger way to train",
];

// Keep every public gallery lively but stable: each coach gets two genuine
// session photos plus a different, curated set of four local video reels.
const createCoachMedia = (coachId, sport, idx) => {
  const photo1 = ((idx * 2) % 12) + 1;
  const photo2 = (((idx * 2) + 1) % 12) + 1;
  const reel1 = (idx % 8) + 1;
  const reel2 = ((idx + 2) % 8) + 1;
  const reel3 = ((idx + 4) % 8) + 1;
  const reel4 = ((idx + 6) % 8) + 1;
  const reelNumbers = [reel1, reel2, reel3, reel4];
  return [
    item(`${coachId}-p1`, "photo", photo(photo1), "Coaching in action", sport),
    item(`${coachId}-p2`, "photo", photo(photo2), "A closer look at training", sport),
    ...reelNumbers.map((number) => item(
      `${coachId}-r${number}`,
      "reel",
      reel(number),
      REEL_CAPTIONS[number - 1],
      sport,
    )),
  ];
};

export const DEFAULT_COACH_MEDIA = {};

// Build default media library for coaches c1 through c56
for (let i = 1; i <= 56; i++) {
  const id = `c${i}`;
  DEFAULT_COACH_MEDIA[id] = createCoachMedia(id, "Sport", i - 1);
}

/** Returns a fresh array so screen actions never mutate the default library. */
export const getCoachMedia = (coachId) => (DEFAULT_COACH_MEDIA[coachId] || DEFAULT_COACH_MEDIA.c1).map((media) => ({ ...media }));

/* Which coach's local reel/photo library each business showcase borrows. */
export const BUSINESS_MEDIA_SOURCE = {
  biz1: "c7",   // Tennis
  biz2: "c3",   // Swimming
  biz3: "c25",  // AFL / Athletic performance
  biz4: "c25",  // Football / Soccer
  biz5: "c6",   // Rowing
  biz6: "c18",  // Basketball
  biz7: "c21",  // Running
  biz8: "c4",   // Boxing
  biz9: "c11",  // Badminton
  biz10: "c14", // Cricket
  biz11: "c15", // Yoga & Pilates
  biz12: "c2",  // Strength & Conditioning
  biz13: "c20", // Padel
  biz14: "c6",  // Cycling
  biz15: "c21", // Athletics & Sprint
};
export const getBusinessMediaSource = (businessId) => BUSINESS_MEDIA_SOURCE[businessId] || "c1";

/* Verified business brand logos present in public/businesslogs/ */
export const BUSINESS_LOGOS = {
  biz1: asset("businesslogs/blogo (1).webp"),
  biz2: asset("businesslogs/blogo (2).webp"),
  biz3: asset("businesslogs/blogo (3).webp"),
  biz4: asset("businesslogs/blogo (4).webp"),
  biz5: asset("businesslogs/blogo (5).webp"),
  biz6: asset("businesslogs/blogo (6).webp"),
  biz7: asset("businesslogs/blogo (7).webp"),
  biz8: asset("businesslogs/blogo (8).webp"),
  biz9: asset("businesslogs/blogo (9).webp"),
  biz10: asset("businesslogs/blogo (10).webp"),
  biz11: asset("businesslogs/blogo (11).webp"),
  biz12: asset("businesslogs/blogo (12).webp"),
  biz13: asset("businesslogs/blogo (13).webp"),
  biz14: asset("businesslogs/blogo (14).webp"),
  biz15: asset("businesslogs/blogo (15).webp"),
};

export const getBusinessLogo = (idOrNum) => {
  if (typeof idOrNum === "number") return asset(`businesslogs/blogo (${idOrNum}).webp`);
  return BUSINESS_LOGOS[idOrNum] || asset("businesslogs/blogo (1).webp");
};

/* -------------------------------------------------------------------------
   FEATURED PROMOTIONAL BANNERS
   -------------------------------------------------------------------------
   Curated hero banners for client discovery showcasing selected packages,
   special clinics, and coach highlights.
   ------------------------------------------------------------------------- */
export const PROMO_BANNERS = [
  {
    id: "banner-1",
    sport: "Football",
    badge: "Academy",
    title: "Junior Football Academy",
    packageMeta: "4 group sessions · Ages 8–16",
    priceTag: "$120 total",
    image: asset("banners/banner (5).webp"),
    imagePosition: "center 45%",
    coachId: "c25",
  },
  {
    id: "banner-2",
    sport: "Basketball",
    badge: "Squad",
    title: "Hoops Development Squad",
    packageMeta: "4 group sessions · 6 players max",
    priceTag: "$120 total",
    image: asset("media/coach (5).webp"),
    imagePosition: "center 42%",
    coachId: "c18",
  },
  {
    id: "banner-3",
    sport: "Tennis",
    badge: "Matchplay",
    title: "Weekend Matchplay Clinic",
    packageMeta: "4 group sessions · 90 min each",
    priceTag: "$140 total",
    image: asset("banners/banner (2).webp"),
    imagePosition: "center 40%",
    coachId: "c20",
  },
  {
    id: "banner-4",
    sport: "Athletics",
    badge: "Speed lab",
    title: "Sprint & Agility Lab",
    packageMeta: "4 group sessions · 6 athletes max",
    priceTag: "$110 total",
    image: asset("media/coach (2).webp"),
    imagePosition: "center 48%",
    coachId: "c21",
  },
  {
    id: "banner-5",
    sport: "Badminton",
    badge: "Workshop",
    title: "Doubles Skills Workshop",
    packageMeta: "4 group sessions · 4 players max",
    priceTag: "$140 total",
    image: asset("media/coach (1).webp"),
    imagePosition: "center 46%",
    coachId: "c11",
  },
];

/* -------------------------------------------------------------------------
   FEATURED BUSINESS SPOTLIGHT BANNERS
   -------------------------------------------------------------------------
   Curated hero banners showcasing top-rated clubs, academies and specialist
   facilities on the Discover screen.
   ------------------------------------------------------------------------- */
export const FEATURED_BUSINESS_BANNERS = [
  {
    id: "feat-biz-1",
    businessId: "biz4",
    tradingName: "Summit Football Lab",
    badge: "Academy",
    sport: "Football",
    headline: "Elite 1v1 & Match Intelligence",
    subhead: "High-tempo development · Synthetic pitch",
    location: "Leichhardt, Sydney",
    rating: 4.9,
    reviews: 215,
    coachCount: 6,
    programCount: 4,
    image: asset("banners/banner (5).webp"),
    imagePosition: "center 45%",
    logo: BUSINESS_LOGOS.biz4,
    tagline: "Verified Academy",
  },
  {
    id: "feat-biz-2",
    businessId: "biz1",
    tradingName: "Apex Tennis Academy",
    badge: "Academy",
    sport: "Tennis",
    headline: "Junior Pathways & Adult Cardio",
    subhead: "Structured pathways · Wheelchair accessible",
    location: "Broadbeach, Gold Coast",
    rating: 4.9,
    reviews: 184,
    coachCount: 5,
    programCount: 3,
    image: asset("banners/banner (2).webp"),
    imagePosition: "center 40%",
    logo: BUSINESS_LOGOS.biz1,
    tagline: "Verified Academy",
  },
  {
    id: "feat-biz-3",
    businessId: "biz6",
    tradingName: "Velocity Hoops Academy",
    badge: "Academy",
    sport: "Basketball",
    headline: "Deliberate Reps & Shot Creation",
    subhead: "FIBA sprung timber courts · Alexandria",
    location: "Alexandria, Sydney",
    rating: 4.9,
    reviews: 168,
    coachCount: 4,
    programCount: 3,
    image: asset("media/coach (5).webp"),
    imagePosition: "center 42%",
    logo: BUSINESS_LOGOS.biz6,
    tagline: "Verified Academy",
  },
  {
    id: "feat-biz-4",
    businessId: "biz2",
    tradingName: "Harbour Swim Collective",
    badge: "Multi-coach",
    sport: "Swimming",
    headline: "Technique-Led Aquatic Coaching",
    subhead: "Video biomechanics & squad lanes",
    location: "Manly, Sydney",
    rating: 4.8,
    reviews: 96,
    coachCount: 4,
    programCount: 3,
    image: asset("banners/banner (1).webp"),
    imagePosition: "center 38%",
    logo: BUSINESS_LOGOS.biz2,
    tagline: "Verified Collective",
  },
  {
    id: "feat-biz-5",
    businessId: "biz8",
    tradingName: "Corestrike Boxing House",
    badge: "Studio",
    sport: "Boxing",
    headline: "Pro Glovework & Explosive Power",
    subhead: "Full sparring ring · Pad work stations",
    location: "Fitzroy, Melbourne",
    rating: 4.9,
    reviews: 92,
    coachCount: 3,
    programCount: 2,
    image: asset("media/coach (4).webp"),
    imagePosition: "center 48%",
    logo: BUSINESS_LOGOS.biz8,
    tagline: "Verified Studio",
  },
  {
    id: "feat-biz-6",
    businessId: "biz3",
    tradingName: "Inner North Performance Club",
    badge: "Club",
    sport: "AFL",
    headline: "Game-Speed Conditioning & Fundamentals",
    subhead: "Community athletic development",
    location: "Brunswick, Melbourne",
    rating: 4.7,
    reviews: 121,
    coachCount: 5,
    programCount: 3,
    image: asset("banners/banner (3).webp"),
    imagePosition: "center 50%",
    logo: BUSINESS_LOGOS.biz3,
    tagline: "Community Club",
  },
];

