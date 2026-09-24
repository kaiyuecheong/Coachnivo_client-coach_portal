import React, { useEffect, useMemo, useRef, useState } from "react";
import { Award, ChevronRight, Clock3, History, Search, Star, X } from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { COACHES } from "../../data/coaches";
import { POPULAR_SPORTS, SPORT_NAMES } from "../../data/sports";
import { getPublicName } from "../../utils/name";
import { Avatar, Card, Chip, EmptyState, TopBar, CoachCardSkeleton } from "../../components/ui/Primitives";
import { SportBadge, SportIcon } from "../../components/ui/SportUI";
import { CardSlider } from "../../components/layout";
import { useResponsive } from "../../theme/responsive";

const RECENT_SEARCHES_KEY = "coachnivo.recent-searches";
const readRecentSearches = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(item => typeof item === "string" && item.trim()).slice(0, 6) : [];
  } catch {
    return [];
  }
};

const saveRecentSearches = (items) => {
  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items));
  } catch {
    // Search still works if private browsing blocks local storage.
  }
};

const normalise = value => String(value || "").trim().toLowerCase().replace(/^@/, "");
const includesQuery = (value, query) => normalise(value).includes(query);

const PACKAGE_RESULTS = COACHES.flatMap(coach => (coach.packages || [])
  .filter(pkg => pkg.active !== false)
  .map(pkg => ({ ...pkg, coach })));

function ResultSection({ title, count, children }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;

  if (!count) return null;
  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ minHeight: 44, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: T.title, fontWeight: 700, color: C.jet, ...fDisplay }}>{title}</h2>
          <span style={{ fontSize: T.captionLg, fontWeight: 600, color: C.slateLight, ...fBody }}>{count}</span>
        </div>
      </div>
      {children}
    </section>
  );
}

function CoachResult({ coach, onOpen }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const pub = getPublicName(coach, "public");
  const sports = coach.sports || [coach.sport];

  return (
    <Card onClick={onOpen} ariaLabel={`View ${pub.name}'s coach profile`} style={{ marginBottom: 10, padding: 14, boxShadow: "0 1px 2px rgba(22,24,29,.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar name={pub.name} src={coach.avatar} size={50} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: T.subtitleLg, fontWeight: 700, color: C.jet, ...fDisplay }}>{pub.name}</span>
            {coach.verified?.identity && <Award size={14} color={C.brand} aria-label="Verified coach" style={{ flexShrink: 0 }} />}
          </div>
          {pub.handle && <div style={{ marginTop: 2, fontSize: T.captionLg, color: C.slateLight, ...fBody }}>{pub.handle}</div>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
            {sports.slice(0, 2).map(sport => <SportBadge key={sport} sport={sport} compact />)}
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, fontSize: T.labelLg, fontWeight: 700, color: C.jet, ...fBody }}>
            <Star size={12} color={C.brand} fill={C.brand} aria-hidden="true" /> {coach.rating.toFixed(1)}
          </div>
          <div style={{ marginTop: 7, fontSize: T.body, fontWeight: 800, color: C.jet, ...fDisplay }}>${coach.packages?.[0]?.price || 0}</div>
          <div style={{ marginTop: 1, fontSize: T.micro, color: C.slateLight, ...fBody }}>from</div>
        </div>
      </div>
    </Card>
  );
}

function PackageResult({ result, onOpen }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const { coach } = result;
  const pub = getPublicName(coach, "public");
  const duration = result.durationMinutes || result.duration;

  return (
    <Card onClick={onOpen} ariaLabel={`View ${result.name} by ${pub.name}`} style={{ marginBottom: 10, padding: 14, boxShadow: "0 1px 2px rgba(22,24,29,.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.brandTint }}>
          <SportIcon sport={result.sport || coach.sport} size={20} color={C.brand} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: T.subtitle, fontWeight: 700, lineHeight: 1.3, color: C.jet, ...fDisplay }}>{result.name}</div>
          <div style={{ marginTop: 4, fontSize: T.captionLg, color: C.slate, ...fBody }}>with {pub.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
            <SportBadge sport={result.sport || coach.sport} compact />
            {duration && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: T.captionLg, color: C.slate, ...fBody }}><Clock3 size={12} aria-hidden="true" />{duration} min</span>}
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: "right" }}>
          <div style={{ fontSize: T.title, fontWeight: 800, color: C.jet, ...fDisplay }}>${result.price}</div>
          <ChevronRight size={16} color={C.slateLight} aria-hidden="true" style={{ marginTop: 8 }} />
        </div>
      </div>
    </Card>
  );
}

function SportResult({ sport, coachCount, packageCount, onOpen }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;

  return (
    <Card onClick={onOpen} ariaLabel={`Search ${sport}`} style={{ marginBottom: 10, padding: 12, boxShadow: "0 1px 2px rgba(22,24,29,.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.brandTint }}>
          <SportIcon sport={sport} size={21} color={C.brand} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: T.subtitle, fontWeight: 700, color: C.jet, ...fDisplay }}>{sport}</div>
          <div style={{ marginTop: 3, fontSize: T.captionLg, color: C.slate, ...fBody }}>
            {coachCount} coach{coachCount === 1 ? "" : "es"} · {packageCount} package{packageCount === 1 ? "" : "s"}
          </div>
        </div>
        <ChevronRight size={16} color={C.slateLight} aria-hidden="true" />
      </div>
    </Card>
  );
}

export function ScreenClientSearchResults() {
  const { darkMode, nav, goBack, params } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();
  const inputRef = useRef(null);
  const [query, setQuery] = useState(() => String(params?.query || ""));
  const [recentSearches, setRecentSearches] = useState(readRecentSearches);
  const [loading, setLoading] = useState(false);
  const q = normalise(query);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 180);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!q) { setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, [q]);

  const rememberQuery = value => {
    const clean = String(value || "").trim();
    if (clean.length < 2) return;
    setRecentSearches(current => {
      const next = [clean, ...current.filter(item => normalise(item) !== normalise(clean))].slice(0, 6);
      saveRecentSearches(next);
      return next;
    });
  };

  const results = useMemo(() => {
    if (!q) return { coaches: [], packages: [], sports: [] };

    const coaches = COACHES.filter(coach => [
      coach.name,
      coach.handle,
      coach.sport,
      ...(coach.sports || []),
      ...(coach.tags || []),
    ].some(value => includesQuery(value, q)));

    const packages = PACKAGE_RESULTS.filter(result => [
      result.name,
      result.description,
      result.sport,
      result.type,
      result.packageType,
      result.coach.name,
      result.coach.handle,
      ...(result.coach.sports || []),
    ].some(value => includesQuery(value, q)));

    const sports = SPORT_NAMES.filter(sport => includesQuery(sport, q));
    return { coaches, packages, sports };
  }, [q]);

  const totalResults = results.coaches.length + results.packages.length + results.sports.length;
  const clearRecent = () => {
    setRecentSearches([]);
    saveRecentSearches([]);
  };
  const chooseSearch = value => {
    setQuery(value);
    rememberQuery(value);
  };
  const submitSearch = event => {
    event.preventDefault();
    rememberQuery(query);
    inputRef.current?.blur();
  };
  const openCoach = coach => {
    rememberQuery(query);
    nav("coach-profile", { id: coach.id });
  };
  const openPackage = result => {
    rememberQuery(query);
    nav("package-detail", { coachId: result.coach.id, packageId: result.id });
  };
  const sportCounts = sport => ({
    coachCount: COACHES.filter(coach => coach.sport === sport || coach.sports?.includes(sport)).length,
    packageCount: PACKAGE_RESULTS.filter(result => result.sport === sport || result.coach.sport === sport || result.coach.sports?.includes(sport)).length,
  });
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.white }}>
      <TopBar title="Search" subtitle="Coaches, packages and sports" onBack={() => goBack("client-home")} />

      <div style={{ padding: isDesktop ? "20px 64px 12px" : "12px 18px 10px", background: C.white, flexShrink: 0 }}>
        <form role="search" onSubmit={submitSearch}>
          <div className="cl-input" style={{ minHeight: 50, display: "flex", alignItems: "center", gap: 10, border: `1.5px solid ${q ? C.brand : C.border}`, background: C.fog, borderRadius: 14, padding: "0 4px 0 14px" }}>
            <Search size={17} color={q ? C.brand : C.slateLight} aria-hidden="true" />
            <input
              ref={inputRef}
              name="marketplace-search"
              type="text"
              role="searchbox"
              inputMode="search"
              autoComplete="off"
              aria-label="Search coaches, packages and sports"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search coaches, packages or sports…"
              style={{ flex: 1, minWidth: 0, minHeight: 46, padding: 0, border: "none", outline: "none", background: "transparent", color: C.jet, fontSize: T.bodyLg, ...fBody }}
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => { setQuery(""); inputRef.current?.focus(); }} style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, border: "none", borderRadius: 12, background: "transparent", cursor: "pointer" }}>
                <X size={16} color={C.slate} aria-hidden="true" />
              </button>
            )}
          </div>
        </form>

      </div>

      <div className="cl-hide-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: "auto", width: "100%", padding: isDesktop ? "24px 64px 48px" : "18px 18px 32px" }}>
        {loading && q ? (
          <CoachCardSkeleton rows={4} />
        ) : !q ? (
          <>
            {recentSearches.length > 0 && (
              <section style={{ marginBottom: 24 }}>
                <div style={{ minHeight: 44, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <History size={15} color={C.brand} aria-hidden="true" />
                    <h2 style={{ margin: 0, fontSize: T.title, fontWeight: 700, color: C.jet, ...fDisplay }}>Recent searches</h2>
                  </div>
                  <button type="button" onClick={clearRecent} style={{ minHeight: 44, padding: "0 4px 0 12px", border: "none", background: "transparent", color: C.brand, cursor: "pointer", fontSize: T.labelLg, fontWeight: 700, ...fBody }}>Clear all</button>
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  {recentSearches.map(item => (
                    <button key={item} type="button" onClick={() => chooseSearch(item)} style={{ width: "100%", minHeight: 48, display: "flex", alignItems: "center", gap: 10, padding: "0 10px", border: "none", borderRadius: 12, background: "transparent", color: C.jet, cursor: "pointer", textAlign: "left" }}>
                      <History size={15} color={C.slateLight} aria-hidden="true" />
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: T.bodyLg, fontWeight: 500, ...fBody }}>{item}</span>
                      <ChevronRight size={15} color={C.slateLight} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                <Award size={15} color={C.brand} aria-hidden="true" />
                <h2 style={{ margin: 0, fontSize: T.title, fontWeight: 700, color: C.jet, ...fDisplay }}>Popular sports</h2>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {POPULAR_SPORTS.slice(0, 12).map(sport => (
                  <Chip key={sport} compact onClick={() => chooseSearch(sport)}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><SportIcon sport={sport} size={13} color={C.brand} />{sport}</span>
                  </Chip>
                ))}
              </div>
            </section>
          </>
        ) : totalResults === 0 ? (
          <EmptyState
            icon={Search}
            title="No matches yet"
            body={`We couldn't find coaches, packages or sports for “${query.trim()}”. Try a sport or coach name.`}
            ctaLabel="Clear search"
            onCta={() => { setQuery(""); inputRef.current?.focus(); }}
            large
          />
        ) : (
          <div aria-live="polite">
            <div style={{ marginBottom: 14, fontSize: T.body, color: C.slate, ...fBody }}>
              <span style={{ fontWeight: 700, color: C.jet }}>{totalResults}</span> result{totalResults === 1 ? "" : "s"} for “{query.trim()}”
            </div>

            <ResultSection title="Sports" count={results.sports.length}>
              {results.sports.map(sport => <SportResult key={sport} sport={sport} {...sportCounts(sport)} onOpen={() => chooseSearch(sport)} />)}
            </ResultSection>

            <ResultSection title="Coaches" count={results.coaches.length}>
              <CardSlider itemWidth={300} ariaLabel="Matching coaches">
                {results.coaches.map(coach => <CoachResult key={coach.id} coach={coach} onOpen={() => openCoach(coach)} />)}
              </CardSlider>
            </ResultSection>

            <ResultSection title="Coach packages" count={results.packages.length}>
              <CardSlider itemWidth={300} ariaLabel="Matching packages">
                {results.packages.map(result => <PackageResult key={`${result.coach.id}-${result.id}`} result={result} onOpen={() => openPackage(result)} />)}
              </CardSlider>
            </ResultSection>
          </div>
        )}
      </div>
    </div>
  );
}
