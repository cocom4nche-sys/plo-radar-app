import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data?.session) {
      onLogin(data.session);
    }

    setLoading(false);
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
          width: 320,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <h2 style={{ color: "white", marginBottom: 10 }}>
          PLO Radar
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: 10,
            borderRadius: 6,
            border: "none",
          }}
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: 10,
            borderRadius: 6,
            border: "none",
          }}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            padding: 10,
            borderRadius: 6,
            border: "none",
            background: "#22c55e",
            color: "white",
            cursor: "pointer",
          }}
        >
          {loading ? "Connexion..." : "Entrer"}
        </button>

        {error && (
          <div style={{ color: "red", fontSize: 13 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}