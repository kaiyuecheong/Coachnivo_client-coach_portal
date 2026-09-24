import React, { useState } from "react";
import { Plus, X, CalendarDays } from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { SectionLabel, Card, Btn, TopBar, Toggle, Badge } from "../../components/ui/Primitives";
import { useApp } from "../../context/AppContext";

const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

let slotIdCounter = 1;
const newSlot = (start = "09:00", end = "17:00") => ({ id: "slot" + slotIdCounter++, start, end });

function defaultAvailability() {
  const availability = {};
  DAYS.forEach((d) => {
    availability[d.key] = d.key === "mon"
      ? { enabled: true, slots: [newSlot("09:00", "12:00"), newSlot("14:00", "18:00")] }
      : { enabled: false, slots: [newSlot()] };
  });
  return availability;
}

export function ScreenCoachAvailabilitySetup({ nav, toast }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const timeInputStyle = {
    border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px", fontSize: T.bodyLg,
    outline: "none", flex: 1, minWidth: 0, boxSizing: "border-box", color: C.jet, background: C.white, ...fBody,
  };
  const [availability, setAvailability] = useState(defaultAvailability);
  const [googleSynced, setGoogleSynced] = useState(false);
  const [appleSynced, setAppleSynced] = useState(false);
  const [blockedHolidays, setBlockedHolidays] = useState([]);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [holidayDraft, setHolidayDraft] = useState("");
  const [oneOffDraft, setOneOffDraft] = useState("");

  const toggleDay = (key) => setAvailability((a) => ({ ...a, [key]: { ...a[key], enabled: !a[key].enabled } }));
  const updateSlot = (key, id, patch) => setAvailability((a) => ({
    ...a, [key]: { ...a[key], slots: a[key].slots.map((s) => (s.id === id ? { ...s, ...patch } : s)) },
  }));
  const addSlot = (key) => setAvailability((a) => ({ ...a, [key]: { ...a[key], slots: [...a[key].slots, newSlot()] } }));
  const removeSlot = (key, id) => setAvailability((a) => ({ ...a, [key]: { ...a[key], slots: a[key].slots.filter((s) => s.id !== id) } }));

  const addSlotToAllEnabled = () => {
    let touched = false;
    setAvailability((a) => {
      const next = { ...a };
      DAYS.forEach((d) => {
        if (next[d.key].enabled) {
          touched = true;
          next[d.key] = { ...next[d.key], slots: [...next[d.key].slots, newSlot()] };
        }
      });
      return next;
    });
    toast(touched ? "Added a time slot to each enabled day" : "Enable at least one day first");
  };

  const blockHoliday = () => {
    if (!holidayDraft) return;
    setBlockedHolidays((h) => [...h, holidayDraft].sort());
    setHolidayDraft("");
    toast("Holiday blocked");
  };
  const removeHoliday = (d) => setBlockedHolidays((h) => h.filter((x) => x !== d));

  const addOneOff = () => {
    if (!oneOffDraft) return;
    setUnavailableDates((u) => [...u, oneOffDraft].sort());
    setOneOffDraft("");
    toast("Unavailable date added");
  };
  const removeOneOff = (d) => setUnavailableDates((u) => u.filter((x) => x !== d));

  function SyncRow({ label, synced, onToggle }) {
    return (
      <Card style={{ padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: C.fog, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CalendarDays size={16} color={C.slate} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: T.body, fontWeight: 600, color: C.jet, ...fBody }}>{label}</div>
            <div style={{ fontSize: T.caption, color: C.slateLight, ...fBody }}>{synced ? "Connected" : "Not connected"}</div>
          </div>
        </div>
        <Btn size="sm" variant={synced ? "secondary" : "outline"} onClick={onToggle}>{synced ? "Synced" : "Sync"}</Btn>
      </Card>
    );
  }

  const canContinue = DAYS.some((d) => availability[d.key].enabled);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="Availability setup" onBack={() => nav("coach-services-setup")} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 24px" }} className="cl-hide-scrollbar">

        <div style={{ fontSize: T.subtitleLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fDisplay }}>
          Availability Setup
        </div>
        <div style={{ fontSize: T.body, color: C.slate, marginBottom: 18, lineHeight: 1.5, ...fBody }}>
          Configure your recurring weekly schedule. Enable the days you coach and set the time windows athletes can book.
        </div>

        <SectionLabel required>Weekly schedule</SectionLabel>
        {DAYS.map((d) => {
          const day = availability[d.key];
          return (
            <Card key={d.key} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: day.enabled ? 10 : 0 }}>
                <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, ...fBody }}>{d.label}</div>
                <Toggle label={`${d.label} availability`} on={day.enabled} onClick={() => toggleDay(d.key)} />
              </div>
              {day.enabled && (
                <div>
                  {day.slots.map((s) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <input type="time" name={`${d.key}-${s.id}-start`} aria-label={`${d.label} start time`} value={s.start} onChange={(e) => updateSlot(d.key, s.id, { start: e.target.value })} style={timeInputStyle} />
                      <span style={{ fontSize: T.label, color: C.slateLight, ...fBody }}>to</span>
                      <input type="time" name={`${d.key}-${s.id}-end`} aria-label={`${d.label} end time`} value={s.end} onChange={(e) => updateSlot(d.key, s.id, { end: e.target.value })} style={timeInputStyle} />
                      {day.slots.length > 1 && (
                        <button type="button" aria-label={`Remove ${d.label} time slot`} onClick={() => removeSlot(d.key, s.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <X size={14} color={C.slateLight} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => addSlot(d.key)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}>
                    <Plus size={13} color={C.brand} />
                    <span style={{ fontSize: T.label, color: C.brand, fontWeight: 600, ...fBody }}>Add time slot</span>
                  </button>
                </div>
              )}
            </Card>
          );
        })}

        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <SectionLabel>Additional actions</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Btn variant="outline" size="sm" icon={Plus} full onClick={addSlotToAllEnabled}>
              Add multiple time slots
            </Btn>

            <Card style={{ padding: 12 }}>
              <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 8, ...fBody }}>Block holiday</div>
              <div style={{ display: "flex", gap: 8, marginBottom: blockedHolidays.length ? 10 : 0 }}>
                <input type="date" name="blocked-holiday" aria-label="Holiday date to block" value={holidayDraft} onChange={(e) => setHolidayDraft(e.target.value)} style={timeInputStyle} />
                <Btn size="sm" variant="outline" onClick={blockHoliday}>Block</Btn>
              </div>
              {blockedHolidays.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {blockedHolidays.map((d) => (
                    <Badge key={d} tone="neutral">
                      {d}
                      <button type="button" aria-label={`Remove blocked holiday ${d}`} onClick={() => removeHoliday(d)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 2, padding: 0 }}>
                        <X size={10} color={C.slate} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </Card>

            <Card style={{ padding: 12 }}>
              <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 8, ...fBody }}>Add One-off Unavailable Date</div>
              <div style={{ display: "flex", gap: 8, marginBottom: unavailableDates.length ? 10 : 0 }}>
                <input type="date" name="one-off-unavailable-date" aria-label="One-off unavailable date" value={oneOffDraft} onChange={(e) => setOneOffDraft(e.target.value)} style={timeInputStyle} />
                <Btn size="sm" variant="outline" onClick={addOneOff}>Add</Btn>
              </div>
              {unavailableDates.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {unavailableDates.map((d) => (
                    <Badge key={d} tone="neutral">
                      {d}
                      <button type="button" aria-label={`Remove unavailable date ${d}`} onClick={() => removeOneOff(d)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 2, padding: 0 }}>
                        <X size={10} color={C.slate} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </Card>

            <SyncRow label="Google Calendar" synced={googleSynced} onToggle={() => { setGoogleSynced((v) => !v); toast(googleSynced ? "Google Calendar disconnected" : "Google Calendar connected"); }} />
            <SyncRow label="Apple Calendar" synced={appleSynced} onToggle={() => { setAppleSynced((v) => !v); toast(appleSynced ? "Apple Calendar disconnected" : "Apple Calendar connected"); }} />
          </div>
        </div>

        <Btn full disabled={!canContinue} onClick={() => { toast("Availability saved"); nav("coach-payout-setup"); }}>
          Continue
        </Btn>
        {!canContinue && (
          <div style={{ fontSize: T.caption, color: C.slateLight, textAlign: "center", marginTop: 8, ...fBody }}>
            Enable availability on at least one day to continue.
          </div>
        )}
      </div>
    </div>
  );
}
