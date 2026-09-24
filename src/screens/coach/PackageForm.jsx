import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { CL, CD, fBody, LAYOUT, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { useResponsive } from "../../theme/responsive";
import { ConfirmDialog, TopBar } from "../../components/ui/Primitives";
import { ServicePackageForm, recordToPackageForm, packageFormToRecord } from "../../components/ui/ServicePackageForm";

/**
 * Dedicated Create Package flow. Also handles editing an existing package
 * when navigated to with params.id — the form is seeded from the matching
 * record and saves overwrite it in place.
 */
export function ScreenCoachPackageForm({ nav, params, toast, coachPackages, savePackage, removePackage }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const editing = params?.id ? coachPackages.find((p) => p.id === params.id) : null;
  const initial = editing ? recordToPackageForm(editing) : undefined;

  const handleSave = (pkg) => {
    savePackage(packageFormToRecord(pkg, editing?.id));
    toast(editing ? "Package updated" : "Package created");
    nav("coach-profile-edit");
  };

  const handleDelete = () => {
    removePackage(editing.id);
    setDeleteOpen(false);
    toast("Package removed");
    nav("coach-profile-edit");
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar
        title={editing ? "Edit package" : "Create package"}
        onBack={() => nav("coach-profile-edit")}
        right={editing ? (
          <button
            onClick={() => setDeleteOpen(true)}
            aria-label="Delete package"
            style={{
              width: LAYOUT.touchTarget, height: LAYOUT.touchTarget, padding: 0, flexShrink: 0,
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Trash2 size={18} color={C.slateLight} />
          </button>
        ) : null}
      />
      <div style={{ flex: 1, overflowY: "auto", width: "100%", padding: isDesktop ? "32px 64px 48px" : "16px 18px 24px" }} className="cl-hide-scrollbar">
        <div style={{ fontSize: T.label, color: C.slate, marginBottom: 16, lineHeight: 1.5, ...fBody }}>
          Package name, price, duration, location and description are all shown to clients when they browse and book.
        </div>
        <ServicePackageForm
          initial={initial}
          onSave={handleSave}
          onCancel={() => nav("coach-profile-edit")}
          saveLabel={editing ? "Save changes" : "Create package"}
        />
      </div>
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Remove this package?"
        description={`“${editing?.name || "This package"}” will disappear from your profile and can no longer be booked. This can't be undone.`}
        confirmLabel="Remove package"
      />
    </div>
  );
}
