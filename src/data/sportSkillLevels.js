import { getSportDefinition, getSportLabel } from "./sports.js";

export const SPORT_LEVEL_IDS = ["new", "developing", "confident", "competitive", "performance"];

const level = (id, label, description) => ({ id, label, description });

const GENERAL_LEVELS = [
  level("new", "New to it", "Little or no experience yet."),
  level("developing", "Learning the fundamentals", "Building the core skills with guidance."),
  level("confident", "Confident participant", "Comfortable training and practising independently."),
  level("competitive", "Competition ready", "Competes regularly or trains towards events."),
  level("performance", "High performance", "Advanced pathway, state, national or professional level."),
];

const TEAM_LEVELS = [
  level("new", "New player", "Little or no playing experience yet."),
  level("developing", "Social or school player", "Learning positions, rules and core skills."),
  level("confident", "Club player", "Trains and plays confidently in a club environment."),
  level("competitive", "Representative player", "Competes at representative or high-grade level."),
  level("performance", "High performance", "State, national, academy or professional pathway."),
];

const RACQUET_LEVELS = [
  level("new", "New to the court", "Learning grip, movement and the basic strokes."),
  level("developing", "Rallying", "Can sustain a simple rally and is building consistency."),
  level("confident", "Club player", "Plays confidently in social or club matches."),
  level("competitive", "Competition player", "Competes regularly in leagues or tournaments."),
  level("performance", "Performance pathway", "State, national or professional-level training."),
];

const SWIMMING_LEVELS = [
  level("new", "Water confidence", "Getting comfortable and safe in the water."),
  level("developing", "Learning strokes", "Building breathing, body position and stroke basics."),
  level("confident", "Stroke confident", "Swims multiple strokes with control and endurance."),
  level("competitive", "Squad swimmer", "Trains in a squad and prepares for race distances."),
  level("performance", "Competitive swimmer", "State, national or performance-program level."),
];

const SURFING_LEVELS = [
  level("new", "First waves", "Learning ocean safety, paddling and pop-ups."),
  level("developing", "Whitewater surfer", "Catches broken waves and is building control."),
  level("confident", "Green-wave surfer", "Selects and rides unbroken waves independently."),
  level("competitive", "Advanced surfer", "Links manoeuvres in varied conditions."),
  level("performance", "Competitive surfer", "Competes at state, national or elite level."),
];

const COMBAT_LEVELS = [
  level("new", "First session", "Little or no formal training yet."),
  level("developing", "Fundamentals", "Learning stance, movement and core techniques."),
  level("confident", "Experienced practitioner", "Trains consistently with sound technique."),
  level("competitive", "Competition level", "Prepares for bouts, grading or tournaments."),
  level("performance", "Elite pathway", "State, national or professional-level training."),
];

const FITNESS_LEVELS = [
  level("new", "New to training", "Starting safely and learning movement patterns."),
  level("developing", "Building foundations", "Training regularly with coached technique."),
  level("confident", "Consistent trainer", "Comfortable with structured, progressive sessions."),
  level("competitive", "Advanced athlete", "Trains for demanding performance goals or events."),
  level("performance", "Competition athlete", "Elite testing, competition or professional pathway."),
];

const ENDURANCE_LEVELS = [
  level("new", "Starting out", "Building safe, sustainable movement habits."),
  level("developing", "Regular participant", "Trains consistently and is extending distance."),
  level("confident", "Event ready", "Can complete organised events with confidence."),
  level("competitive", "Competitive athlete", "Races regularly and trains to improve results."),
  level("performance", "High performance", "State, national or professional endurance pathway."),
];

const MOVEMENT_LEVELS = [
  level("new", "New mover", "Exploring the basic shapes, rhythm and movement skills."),
  level("developing", "Foundation level", "Building coordination, control and core technique."),
  level("confident", "Confident performer", "Practises combinations or routines independently."),
  level("competitive", "Competition level", "Performs or competes at an advanced level."),
  level("performance", "Elite pathway", "State, national, pre-professional or professional level."),
];

const TARGET_LEVELS = [
  level("new", "First sessions", "Learning safe setup, rules and basic technique."),
  level("developing", "Building consistency", "Developing repeatable technique and control."),
  level("confident", "Club level", "Practises confidently and tracks performance."),
  level("competitive", "Tournament level", "Competes regularly in graded events."),
  level("performance", "Performance pathway", "State, national or professional-level competition."),
];

const AQUATIC_LEVELS = [
  level("new", "New to the water", "Learning safety, setup and basic movement."),
  level("developing", "Building control", "Practising core technique in supported conditions."),
  level("confident", "Independent participant", "Handles regular sessions with confidence."),
  level("competitive", "Competition ready", "Trains for races, regattas or graded events."),
  level("performance", "High performance", "State, national or professional aquatic pathway."),
];

const OUTDOOR_LEVELS = [
  level("new", "First sessions", "Learning equipment, safety and core movement."),
  level("developing", "Building foundations", "Practising technique in supported environments."),
  level("confident", "Independent participant", "Comfortable planning and completing sessions."),
  level("competitive", "Advanced level", "Handles technical goals, routes or events."),
  level("performance", "Elite pathway", "High-performance or professional-level training."),
];

const SNOW_LEVELS = [
  level("new", "First time on snow", "Learning equipment, balance and safe stopping."),
  level("developing", "Linking turns", "Controls speed and direction on easier terrain."),
  level("confident", "All-mountain rider", "Confident across varied groomed terrain."),
  level("competitive", "Advanced rider", "Develops technical, park, race or off-piste skills."),
  level("performance", "Competition pathway", "State, national or professional-level training."),
];

const SKATE_LEVELS = [
  level("new", "First push", "Learning balance, rolling and how to stop safely."),
  level("developing", "Building board control", "Comfortable riding and learning foundational tricks."),
  level("confident", "Confident skater", "Links tricks and navigates parks independently."),
  level("competitive", "Advanced skater", "Builds technical lines and competition runs."),
  level("performance", "Competition pathway", "State, national or professional-level skating."),
];

const MIND_BODY_LEVELS = [
  level("new", "New to practice", "Learning the foundational positions and breathing."),
  level("developing", "Foundation practice", "Building control, alignment and consistency."),
  level("confident", "Regular practitioner", "Comfortable with progressive sequences and cues."),
  level("competitive", "Advanced practice", "Works confidently with complex, demanding movement."),
  level("performance", "Teacher or specialist", "Instructor-level or specialist performance practice."),
];

const PROFILE_BY_SPORT = {
  Swimming: SWIMMING_LEVELS,
  Surfing: SURFING_LEVELS,
  Boxing: COMBAT_LEVELS,
  Fencing: COMBAT_LEVELS,
  "Martial Arts": COMBAT_LEVELS,
  Yoga: MIND_BODY_LEVELS,
  Pilates: MIND_BODY_LEVELS,
  Running: ENDURANCE_LEVELS,
  Cycling: ENDURANCE_LEVELS,
  Triathlon: ENDURANCE_LEVELS,
  Athletics: ENDURANCE_LEVELS,
  Skateboarding: SKATE_LEVELS,
};

const PROFILE_BY_CATEGORY = {
  Team: TEAM_LEVELS,
  Racquet: RACQUET_LEVELS,
  Combat: COMBAT_LEVELS,
  Fitness: FITNESS_LEVELS,
  Endurance: ENDURANCE_LEVELS,
  Athletics: ENDURANCE_LEVELS,
  Movement: MOVEMENT_LEVELS,
  Target: TARGET_LEVELS,
  Aquatic: AQUATIC_LEVELS,
  Outdoor: OUTDOOR_LEVELS,
  Snow: SNOW_LEVELS,
  Action: SKATE_LEVELS,
};

const LEGACY_LEVEL_IDS = {
  beginner: "new",
  intermediate: "developing",
  advanced: "competitive",
  elite: "performance",
};

export function getSportSkillLevels(sport) {
  const definition = getSportDefinition(sport);
  return PROFILE_BY_SPORT[definition.name] || PROFILE_BY_CATEGORY[definition.category] || GENERAL_LEVELS;
}

export function getSportSkillLevel(sport, levelId) {
  return getSportSkillLevels(sport).find((item) => item.id === levelId) || null;
}

export function normaliseSportLevels(sports = [], sportLevels = {}, legacySkillLevel = "") {
  const uniqueSports = [...new Set(Array.isArray(sports) ? sports.filter(Boolean) : [])];
  const legacyId = LEGACY_LEVEL_IDS[String(legacySkillLevel || "").trim().toLowerCase()] || "";
  return uniqueSports.reduce((next, sport) => {
    const currentId = sportLevels && typeof sportLevels === "object" ? sportLevels[sport] : "";
    next[sport] = getSportSkillLevel(sport, currentId)?.id || legacyId;
    return next;
  }, {});
}

export function hasCompleteSportLevels(sports = [], sportLevels = {}) {
  return Array.isArray(sports)
    && sports.length > 0
    && sports.every((sport) => !!getSportSkillLevel(sport, sportLevels?.[sport]));
}

export function describeSportLevel(sport, levelId) {
  const selected = getSportSkillLevel(sport, levelId);
  return selected ? `${getSportLabel(sport)} · ${selected.label}` : getSportLabel(sport);
}
