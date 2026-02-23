import { useState } from "react";
import { supabase } from "./supabaseClient";

const FIXED_EMAIL = "admin@ploradar.app";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: FIXED_EMAIL,
      password,
    });

    if (error) {
      setError("Mot de passe incorrect");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: "#111827",
          padding: 30,
          borderRadius: 12,
          width: 300,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <h2 style={{ color: "white", marginBottom: 10 }}>
          PLO Radar
        </h2>

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 6,
            border: "none",
          }}
        />

        <button
          onClick={handleLogin}
          style={{
            padding: 8,
            borderRadius: 6,
            border: "none",
            background: "#22c55e",
            color: "white",
            cursor: "pointer",
          }}
        >
          Entrer
        </button>

        {error && (
          <div style={{ color: "red", fontSize: 12 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}