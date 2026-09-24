import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { SectionLabel, Card, Btn, ConfirmDialog, TopBar } from "../../components/ui/Primitives";
import { ServicePackageForm, packageSummary, packageFormToRecord } from "../../components/ui/ServicePackageForm";
import { SportBadge } from "../../components/ui/SportUI";

let svcIdCounter = 1;

export function ScreenCoachServicesSetup({ nav, toast, savePackage, removePackage }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const [services, setServices] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const addService = (pkg) => {
    const id = "svc" + svcIdCounter++;
    setServices((s) => [...s, { id, ...pkg }]);
    // Persist to the coach's real service list so it's immediately visible
    // on the dashboard and profile once setup is complete.
    if (savePackage) savePackage(packageFormToRecord(pkg, id));
    toast(services.length === 0 ? "Service added" : "Another service added");
  };
  const removeService = (id) => {
    setServices((s) => s.filter((x) => x.id !== id));
    if (removePackage) removePackage(id);
    setDeleteTarget(null);
    toast("Service removed");
  };

  const canContinue = services.length > 0;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="Coaching services" onBack={() => nav("verification-pending")} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 24px" }} className="cl-hide-scrollbar">

        <div style={{ fontSize: T.subtitleLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fDisplay }}>
          Add coaching services
        </div>
        <div style={{ fontSize: T.body, color: C.slate, marginBottom: 18, lineHeight: 1.5, ...fBody }}>
          Create the coaching services athletes can book. Define your session types, pricing, duration, and delivery method to showcase what you offer.
        </div>

        {services.map((s) => (
          <Card key={s.id} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: T.subtitle, fontWeight: 600, color: C.jet, ...fDisplay }}>{s.name}</div>
                <div style={{ marginTop: 6 }}><SportBadge sport={s.sport} compact /></div>
                <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>{packageSummary(s)}</div>
                {s.venue && (
                  <div style={{ fontSize: T.captionLg, color: C.slateLight, marginTop: 2, ...fBody }}>{s.venue}</div>
                )}
                {s.equipment && (
                  <div style={{ fontSize: T.captionLg, color: C.slateLight, marginTop: 2, ...fBody }}>Equipment: {s.equipment}</div>
                )}
                {s.description && (
                  <div style={{ fontSize: T.captionLg, color: C.slateLight, marginTop: 4, lineHeight: 1.5, ...fBody }}>{s.description}</div>
                )}
              </div>
              <button onClick={() => setDeleteTarget(s)} aria-label={`Remove ${s.name}`} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexShrink: 0, marginLeft: 8 }}>
                <Trash2 size={15} color={C.slateLight} />
              </button>
            </div>
          </Card>
        ))}

        <SectionLabel required>{services.length > 0 ? "Add another service" : "Add a service"}</SectionLabel>
        <ServicePackageForm
          key={services.length}
          onSave={addService}
          saveLabel={services.length > 0 ? "Add Another Service" : "Add Service"}
        />

        <Btn full disabled={!canContinue} onClick={() => { toast("Coaching services saved"); nav("coach-availability-setup"); }}>
          Continue
        </Btn>
        {!canContinue && (
          <div style={{ fontSize: T.caption, color: C.slateLight, textAlign: "center", marginTop: 8, ...fBody }}>
            Add at least one coaching service to continue.
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => removeService(deleteTarget?.id)}
        title="Remove this service?"
        description={`“${deleteTarget?.name || "This service"}” will be removed from your profile and booking options.`}
        confirmLabel="Remove service"
      />
    </div>
  );
}
