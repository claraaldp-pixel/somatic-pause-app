import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Check } from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

const C = {
  lavenderDark:  "oklch(50% 0.13 295)",
  lavenderLight: "#ede8f8",
  text:          "#2d2840",
  textMid:       "#6b6480",
  textLight:     "#9d97ac",
  border:        "#e8e4dc",
};

function Field({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", fontSize: 14, color: C.text,
          border: `1px solid ${C.border}`, borderRadius: 10,
          padding: "10px 14px", outline: "none",
          background: "#fff", fontFamily: "inherit", boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function StatusMsg({ msg }) {
  if (!msg) return null;
  const isError = msg.startsWith("!");
  return (
    <p style={{ fontSize: 12, fontWeight: 600, color: isError ? "#c97a85" : "#2e5a28", marginTop: 4 }}>
      {isError ? msg.slice(1) : msg}
    </p>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: `1px solid ${C.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.04)", marginBottom: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 18 }}>{title}</p>
      {children}
    </div>
  );
}

function SaveButton({ onClick, loading, label = "Save changes" }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: "10px 20px", borderRadius: 10,
        background: loading ? C.lavenderLight : C.lavenderDark,
        border: "none", fontSize: 13, fontWeight: 700,
        color: loading ? C.textMid : "#fff", cursor: loading ? "default" : "pointer",
        transition: "background 0.2s",
      }}
    >
      {loading ? "Saving…" : label}
    </button>
  );
}

export default function Settings({ onBack }) {
  const { user, logout } = useAuth();

  // Display name
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg] = useState("");

  // Email
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");

  const handleSaveName = async () => {
    if (!displayName.trim()) { setNameMsg("!Name can't be empty."); return; }
    setNameLoading(true); setNameMsg("");
    const { error } = await supabase.auth.updateUser({ data: { full_name: displayName.trim() } });
    setNameLoading(false);
    setNameMsg(error ? `!${error.message}` : "Display name updated.");
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) { setEmailMsg("!Enter a new email address."); return; }
    setEmailLoading(true); setEmailMsg("");
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailLoading(false);
    if (error) { setEmailMsg(`!${error.message}`); return; }
    setEmailMsg("Confirmation sent to your new email. Click the link to confirm.");
    setNewEmail("");
  };

  const handleChangePassword = async () => {
    if (!newPassword) { setPasswordMsg("!Enter a new password."); return; }
    if (newPassword.length < 8) { setPasswordMsg("!Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordMsg("!Passwords don't match."); return; }
    setPasswordLoading(true); setPasswordMsg("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) { setPasswordMsg(`!${error.message}`); return; }
    setPasswordMsg("Password updated.");
    setNewPassword(""); setConfirmPassword("");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ paddingTop: 16 }}>
      <button
        onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMid, fontSize: 13, background: "none", border: "none", cursor: "pointer", marginBottom: 28 }}
      >
        <ChevronLeft style={{ width: 16, height: 16 }} />
        Back
      </button>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>⚙️</span>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1px", color: C.textLight, fontWeight: 700 }}>Account</p>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.5px" }}>Settings</h2>
      </div>

      {/* Profile */}
      <Card title="Profile">
        <p style={{ fontSize: 12, color: C.textLight, marginBottom: 14 }}>
          Signed in as <strong style={{ color: C.textMid }}>{user?.email}</strong>
        </p>
        <Field label="Display name" value={displayName} onChange={setDisplayName} placeholder="Your name" />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SaveButton onClick={handleSaveName} loading={nameLoading} />
          <StatusMsg msg={nameMsg} />
        </div>
      </Card>

      {/* Email */}
      <Card title="Change email">
        <p style={{ fontSize: 12, color: C.textLight, marginBottom: 14 }}>
          A confirmation link will be sent to your new address.
        </p>
        <Field label="New email address" type="email" value={newEmail} onChange={setNewEmail} placeholder="new@email.com" />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SaveButton onClick={handleChangeEmail} loading={emailLoading} label="Send confirmation" />
          <StatusMsg msg={emailMsg} />
        </div>
      </Card>

      {/* Password */}
      <Card title="Change password">
        <Field label="New password" type="password" value={newPassword} onChange={setNewPassword} placeholder="Min. 8 characters" />
        <Field label="Confirm new password" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Repeat password" />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SaveButton onClick={handleChangePassword} loading={passwordLoading} label="Update password" />
          <StatusMsg msg={passwordMsg} />
        </div>
      </Card>

      {/* Sign out */}
      <div style={{ marginTop: 8 }}>
        <button
          onClick={logout}
          style={{
            width: "100%", padding: "13px", borderRadius: 12,
            background: "#fff", border: `1px solid ${C.border}`,
            fontSize: 13, fontWeight: 700, color: "#c97a85", cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </div>
    </motion.div>
  );
}
