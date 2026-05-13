import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
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

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

export default function AdminInvite({ onBack }) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  if (user?.email !== ADMIN_EMAIL) {
    return (
      <div style={{ paddingTop: 80, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: C.textMid }}>You don't have access to this page.</p>
      </div>
    );
  }

  const handleInvite = async () => {
    if (!email.trim()) { setMsg("!Enter an email address."); return; }
    setLoading(true); setMsg("");

    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      }
    );

    const json = await res.json();
    setLoading(false);

    if (!res.ok || json.error) {
      setMsg(`!${json.error || "Something went wrong."}`);
    } else {
      setMsg(`Invitation sent to ${email.trim().toLowerCase()}.`);
      setEmail("");
    }
  };

  const isError = msg.startsWith("!");

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
          <span style={{ fontSize: 18 }}>✉️</span>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1px", color: C.textLight, fontWeight: 700 }}>Admin</p>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.5px", marginBottom: 4 }}>Invite a user</h2>
        <p style={{ fontSize: 13, color: C.textMid }}>Adds the email to the whitelist and sends an invitation.</p>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: `1px solid ${C.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleInvite()}
          placeholder="friend@email.com"
          style={{
            width: "100%", fontSize: 14, color: C.text,
            border: `1px solid ${C.border}`, borderRadius: 10,
            padding: "10px 14px", outline: "none",
            background: "#fff", fontFamily: "inherit",
            boxSizing: "border-box", marginBottom: 16,
          }}
        />
        <button
          onClick={handleInvite}
          disabled={loading}
          style={{
            width: "100%", padding: "12px", borderRadius: 10,
            background: loading ? C.lavenderLight : C.lavenderDark,
            border: "none", fontSize: 13, fontWeight: 700,
            color: loading ? C.textMid : "#fff",
            cursor: loading ? "default" : "pointer",
            transition: "background 0.2s",
          }}
        >
          {loading ? "Sending…" : "Send invitation"}
        </button>

        {msg && (
          <p style={{ fontSize: 12, fontWeight: 600, marginTop: 12, color: isError ? "#c97a85" : "#2e5a28" }}>
            {isError ? msg.slice(1) : msg}
          </p>
        )}
      </div>
    </motion.div>
  );
}
