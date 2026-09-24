import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, CircleHelp, Sparkles } from "lucide-react";
import { CL, CD, fBody, fDisplay, LAYOUT, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { getSportLabel } from "../../data/sports";
import { getSportSkillLevel, getSportSkillLevels } from "../../data/sportSkillLevels";
import { SportIcon } from "./SportUI";

function LevelOption({ option, selected, onSelect, C }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="cl-pressable"
      style={{
        width: "100%", minHeight: 58, display: "flex", alignItems: "center", gap: 11,
        padding: "10px 11px", borderRadius: 14, textAlign: "left", cursor: "pointer",
        border: `1.5px solid ${selected ? C.brand : C.border}`,
        background: selected ? C.brandTint : C.white, boxSizing: "border-box",
      }}
    >
      <span style={{
        width: 22, height: 22, borderRadius: 99, flexShrink: 0,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        border: `1.5px solid ${selected ? C.brand : C.border}`,
        background: selected ? C.brand : C.white,
      }}>
        {selected && <Check size={13} strokeWidth={3} color={C.white} />}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", color: C.jet, fontSize: T.body, fontWeight: 700, lineHeight: 1.25, ...fBody }}>{option.label}</span>
        <span style={{ display: "block", color: C.slate, fontSize: T.captionLg, lineHeight: 1.45, marginTop: 3, ...fBody }}>{option.description}</span>
      </span>
    </button>
  );
}

function SportLevelCard({ sport, selectedId, expanded, onToggle, onSelect, C }) {
  const options = getSportSkillLevels(sport);
  const selected = getSportSkillLevel(sport, selectedId);
  const label = getSportLabel(sport);

  return (
    <div style={{
      border: `1px solid ${expanded ? C.brand : C.border}`,
      borderRadius: LAYOUT.cardRadius, overflow: "hidden",
      background: C.white, boxShadow: expanded ? `0 8px 24px ${C.brandTint}` : "none",
    }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`${label}: ${selected ? selected.label : "choose a level"}`}
        style={{
          width: "100%", minHeight: 66, display: "flex", alignItems: "center", gap: 11,
          padding: "11px 12px", border: "none", background: expanded ? C.brandTint : C.white,
          color: C.jet, textAlign: "left", cursor: "pointer", boxSizing: "border-box",
        }}
      >
        <span style={{
          width: 40, height: 40, borderRadius: 13, flexShrink: 0,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: selected ? C.brand : C.fog,
          color: selected ? C.white : (C.brandIcon || C.brandColor),
        }}>
          <SportIcon sport={sport} size={21} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", color: C.jet, fontSize: T.bodyLg, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fBody }}>{label}</span>
          <span style={{ display: "block", color: selected ? (C.brandIcon || C.brandColor) : C.slate, fontSize: T.captionLg, fontWeight: selected ? 700 : 500, marginTop: 3, ...fBody }}>
            {selected ? selected.label : "Level needed"}
          </span>
        </span>
        {selected && !expanded && (
          <span style={{ width: 24, height: 24, borderRadius: 99, display: "inline-flex", alignItems: "center", justifyContent: "center", background: C.successTint, color: C.success, flexShrink: 0 }}>
            <Check size={14} strokeWidth={3} />
          </span>
        )}
        {expanded ? <ChevronDown size={18} color={C.slate} /> : <ChevronRight size={18} color={C.slateLight} />}
      </button>

      {expanded && (
        <div role="radiogroup" aria-label={`${label} experience level`} style={{ padding: "5px 10px 11px", display: "flex", flexDirection: "column", gap: 8, background: C.white }}>
          <div style={{ color: C.slate, fontSize: T.captionLg, lineHeight: 1.45, padding: "3px 2px 2px", ...fBody }}>
            Choose the description closest to your experience today.
          </div>
          {options.map((option) => (
            <LevelOption key={option.id} option={option} selected={selectedId === option.id} onSelect={() => onSelect(option.id)} C={C} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SportSkillLevelPicker({ sports = [], value = {}, onChange }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const uniqueSports = useMemo(() => [...new Set((sports || []).filter(Boolean))], [sports]);
  const completed = uniqueSports.filter((sport) => !!getSportSkillLevel(sport, value?.[sport])).length;
  const [expandedSport, setExpandedSport] = useState(() => uniqueSports.find((sport) => !getSportSkillLevel(sport, value?.[sport])) || null);
  const previousSportsRef = useRef(uniqueSports);

  useEffect(() => {
    const previousSports = previousSportsRef.current;
    const addedSport = uniqueSports.find((sport) => !previousSports.includes(sport));
    previousSportsRef.current = uniqueSports;

    if (!uniqueSports.length) {
      setExpandedSport(null);
      return;
    }
    if (addedSport && !getSportSkillLevel(addedSport, value?.[addedSport])) {
      setExpandedSport(addedSport);
      return;
    }
    if (expandedSport !== null && !uniqueSports.includes(expandedSport)) {
      setExpandedSport(uniqueSports.find((sport) => !getSportSkillLevel(sport, value?.[sport])) || null);
    }
  }, [expandedSport, uniqueSports, value]);

  const selectLevel = (sport, levelId) => {
    const nextValue = { ...value, [sport]: levelId };
    onChange?.(nextValue);
    const currentIndex = uniqueSports.indexOf(sport);
    const nextIncomplete = uniqueSports.find((item, index) => index > currentIndex && !getSportSkillLevel(item, nextValue[item]))
      || uniqueSports.find((item) => item !== sport && !getSportSkillLevel(item, nextValue[item]));
    setExpandedSport(nextIncomplete || null);
  };

  if (!uniqueSports.length) {
    return (
      <div style={{
        minHeight: 106, border: `1px dashed ${C.border}`, borderRadius: LAYOUT.cardRadius,
        background: C.fog, display: "flex", alignItems: "center", gap: 12, padding: 14,
      }}>
        <span style={{ width: 40, height: 40, borderRadius: 13, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: C.white, color: C.brandIcon || C.brandColor }}>
          <CircleHelp size={20} />
        </span>
        <span>
          <span style={{ display: "block", color: C.jet, fontSize: T.body, fontWeight: 700, ...fBody }}>Choose a sport first</span>
          <span style={{ display: "block", color: C.slate, fontSize: T.captionLg, lineHeight: 1.45, marginTop: 3, ...fBody }}>Your level choices will adapt to each sport you add.</span>
        </span>
      </div>
    );
  }

  const allComplete = completed === uniqueSports.length;
  const progress = `${Math.round((completed / uniqueSports.length) * 100)}%`;

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "11px 12px",
        background: allComplete ? C.successTint : C.fog, borderRadius: 15, marginBottom: 10,
      }}>
        <span style={{ width: 32, height: 32, borderRadius: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", background: allComplete ? C.success : C.brandTint, color: allComplete ? C.white : (C.brandIcon || C.brandColor), flexShrink: 0 }}>
          {allComplete ? <Check size={17} strokeWidth={3} /> : <Sparkles size={16} />}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", color: C.jet, fontSize: T.body, fontWeight: 700, ...fDisplay }}>{allComplete ? "Experience complete" : `${completed} of ${uniqueSports.length} levels added`}</span>
          <span style={{ display: "block", color: C.slate, fontSize: T.captionLg, marginTop: 2, ...fBody }}>{allComplete ? "You can change any level below." : "Add one level for each selected sport."}</span>
        </span>
        <span style={{ color: allComplete ? C.success : C.slate, fontSize: T.captionLg, fontWeight: 700, ...fBody }}>{progress}</span>
      </div>
      <div aria-hidden="true" style={{ height: 4, borderRadius: 99, background: C.border, overflow: "hidden", margin: "0 2px 12px" }}>
        <div style={{ width: progress, height: "100%", borderRadius: 99, background: allComplete ? C.success : C.brand, transition: "width .2s ease" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {uniqueSports.map((sport) => (
          <SportLevelCard
            key={sport}
            sport={sport}
            selectedId={value?.[sport] || ""}
            expanded={expandedSport === sport}
            onToggle={() => setExpandedSport((current) => current === sport ? null : sport)}
            onSelect={(levelId) => selectLevel(sport, levelId)}
            C={C}
          />
        ))}
      </div>
    </div>
  );
}
