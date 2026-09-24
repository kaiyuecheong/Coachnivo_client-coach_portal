import React, { useState } from "react";
import { User, Landmark, Hash, FileText } from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { TopBar, Btn, FormSection, RequiredMark } from "../../components/ui/Primitives";
import { useApp } from "../../context/AppContext";

export function ScreenCoachPayoutSetup({ nav, goBack, params, toast }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const labelStyle = { fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody };
  const fieldWrapStyle = {
    display: "flex", alignItems: "center", gap: 8, border: `1.5px solid ${C.border}`,
    borderRadius: 13, padding: "11px 13px", boxSizing: "border-box", background: C.white,
  };
  const fieldInputStyle = { border: "none", outline: "none", flex: 1, fontSize: T.bodyLg, minWidth: 0, color: C.jet, ...fBody };
  const editing = params?.mode === "edit";
  const [accountHolder, setAccountHolder] = useState(editing ? "Noah Kelly" : "");
  const [bankName, setBankName] = useState(editing ? "Commonwealth Bank" : "");
  const [accountNumber, setAccountNumber] = useState(editing ? "10202210" : "");
  const [routingNumber, setRoutingNumber] = useState(editing ? "062000" : "");
  const [taxInfo, setTaxInfo] = useState("");

  const canContinue = accountHolder.trim().length > 0 && bankName.trim().length > 0
    && accountNumber.trim().length > 0 && routingNumber.trim().length > 0;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title={editing ? "Payout method" : "Payout setup"} onBack={() => goBack(editing ? "coach-earnings" : "coach-availability-setup")} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 24px" }} className="cl-hide-scrollbar">

        <div style={{ fontSize: T.subtitleLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fDisplay }}>
          {editing ? "Update your bank account" : "Payout setup"}
        </div>
        <div style={{ fontSize: T.body, color: C.slate, marginBottom: 18, lineHeight: 1.5, ...fBody }}>
          {editing ? "Keep your payout details current so future earnings reach the right account." : "Add your bank account information to receive payments for completed coaching sessions."}
        </div>

        <FormSection icon={Landmark} label="Bank details" hint="Where we'll send your earnings.">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={labelStyle}>Account holder name<RequiredMark /></div>
              <div className="cl-input" style={fieldWrapStyle}>
                <User size={16} color={C.slateLight} />
                <input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="e.g. Josh Whitfield" style={fieldInputStyle} />
              </div>
            </div>

            <div>
              <div style={labelStyle}>Bank name<RequiredMark /></div>
              <div className="cl-input" style={fieldWrapStyle}>
                <Landmark size={16} color={C.slateLight} />
                <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Commonwealth Bank" style={fieldInputStyle} />
              </div>
            </div>

            <div>
              <div style={labelStyle}>Account number<RequiredMark /></div>
              <div className="cl-input" style={fieldWrapStyle}>
                <Hash size={16} color={C.slateLight} />
                <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ""))} placeholder="e.g. 12345678" inputMode="numeric" style={fieldInputStyle} />
              </div>
            </div>

            <div>
              <div style={labelStyle}>BSB / Routing number<RequiredMark /></div>
              <div className="cl-input" style={fieldWrapStyle}>
                <Hash size={16} color={C.slateLight} />
                <input value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value.replace(/[^0-9]/g, ""))} placeholder="e.g. 062-000" inputMode="numeric" style={fieldInputStyle} />
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection icon={FileText} label="Tax information (optional)" hint="Only required in some regions - leave blank if it doesn't apply to you.">
          <div>
            <div style={labelStyle}>Tax information (if required)</div>
            <div className="cl-input" style={fieldWrapStyle}>
              <FileText size={16} color={C.slateLight} />
              <input value={taxInfo} onChange={(e) => setTaxInfo(e.target.value)} placeholder="e.g. ABN or Tax File Number" style={fieldInputStyle} />
            </div>
          </div>
        </FormSection>

        <Btn full disabled={!canContinue} onClick={() => {
          toast(editing ? "Payout method updated" : "Payout details saved");
          if (editing) goBack("coach-earnings");
          else nav("coach-setup-complete");
        }}>
          {editing ? "Save payout method" : "Complete setup"}
        </Btn>
        {!canContinue && (
          <div style={{ fontSize: T.caption, color: C.slateLight, textAlign: "center", marginTop: 8, ...fBody }}>
            Add your account holder name, bank name, account number and BSB / routing number to finish.
          </div>
        )}
      </div>
    </div>
  );
}
