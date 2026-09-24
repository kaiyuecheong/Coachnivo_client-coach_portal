/*
 * Build the current coach's public profile from the directory seed plus the
 * editable coach state. Keeping this in one place prevents the coach-facing
 * profile and the client-facing profile from drifting apart.
 */
export function formatCoachLocation(location, fallback = "") {
  if (!location) return fallback;
  if (typeof location === "string") return location;
  if (typeof location === "object") {
    return [location.suburb, location.state].filter(Boolean).join(", ") || fallback;
  }
  return fallback;
}

const unique = (items) => [...new Set((items || []).filter(Boolean))];

function addMinutesToTime(value, minutes) {
  const [hours, mins] = String(value || "00:00").split(":").map(Number);
  const total = ((hours * 60 + mins + minutes) % 1440 + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function availabilityBlocksToWeekly(blocks, pkg, packages = []) {
  const durations = packages.map((p) => Number(p.duration || p.durationMinutes)).filter(Boolean);
  const duration = Number(pkg?.duration || pkg?.durationMinutes || Math.min(...durations, 60));
  const out = {};
  (blocks || []).forEach((block) => {
    if (pkg && Array.isArray(block.packageIds) && block.packageIds.length && !block.packageIds.includes(pkg.id)) return;
    (block.days || []).forEach((day) => {
      let cursor = block.start;
      const slots = out[day] || [];
      while (cursor && addMinutesToTime(cursor, duration) <= block.end) {
        if (!slots.includes(cursor)) slots.push(cursor);
        cursor = addMinutesToTime(cursor, 30);
      }
      out[day] = slots.sort();
    });
  });
  return out;
}

export function getCoachPublicProfile({ base, onboarding = {}, packages, availableNow } = {}) {
  const source = base || {};
  const primarySports = Array.isArray(onboarding.primarySports) ? onboarding.primarySports : [];
  const savedSports = Array.isArray(onboarding.sports) ? onboarding.sports : [];
  const secondarySports = Array.isArray(onboarding.secondarySports) ? onboarding.secondarySports : [];
  const sports = unique([
    ...(savedSports.length ? savedSports : primarySports),
    ...secondarySports,
  ]);
  const expertise = unique([
    ...(onboarding.coachingCategories || []),
    ...(onboarding.skillLevels || []),
    ...(onboarding.ageGroups || []),
    ...(onboarding.coachingFormats || []),
  ]);
  const tags = Array.isArray(onboarding.specialties)
    ? unique(onboarding.specialties)
    : expertise.length
      ? expertise.slice(0, 8)
      : (source.tags || []);
  const yearsExperience = onboarding.yearsExperience;
  const experience = yearsExperience !== undefined && yearsExperience !== null && yearsExperience !== ""
    ? `${yearsExperience} yrs coaching`
    : (source.experience || "");
  const location = formatCoachLocation(onboarding.location, source.suburb || "");

  return {
    ...source,
    name: onboarding.name ?? source.name,
    handle: onboarding.handle ?? source.handle,
    namePrivacy: onboarding.namePrivacy ?? source.namePrivacy,
    avatar: onboarding.photo ?? source.avatar,
    coverPhoto: onboarding.coverPhoto ?? source.coverPhoto,
    bio: onboarding.bio ?? source.bio,
    experience,
    sports: sports.length ? sports : [source.sport].filter(Boolean),
    sport: sports[0] || source.sport,
    tags,
    languages: Array.isArray(onboarding.languages) ? onboarding.languages : (source.languages || ["English"]),
    suburb: location,
    venue: onboarding.venue ?? source.venue,
    travelRadiusKm: onboarding.travelRadiusKm ?? source.travelRadiusKm,
    willingToTravel: onboarding.willingToTravel ?? source.willingToTravel,
    accreditations: Array.isArray(onboarding.accreditations) ? onboarding.accreditations : (source.accreditations || []),
    packages: Array.isArray(packages) ? packages : (source.packages || []),
    availableNow: typeof availableNow === "boolean" ? availableNow : true,
  };
}
