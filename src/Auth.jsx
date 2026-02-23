import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
  };

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) alert(error.message);
    else alert("Compte créé");
  };

  return (
    <div style={styles.container}>
      <h2>PLO Radar Login</h2>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={styles.input}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={styles.input}
      />

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={signIn} style={styles.btnPrimary}>
          Login
        </button>
        <button onClick={signUp} style={styles.btnGhost}>
          Sign Up
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#0b1220",
    color: "white",
  },
  input: {
    padding: 8,
    borderRadius: 8,
    border: "1px solid #334155",
    background: "#0f172a",
    color: "white",
    width: 250,
  },
  btnPrimary: {
    padding: "6px 12px",
    borderRadius: 8,
    background: "#22c55e",
    border: "none",
    color: "white",
    cursor: "pointer",
  },
  btnGhost: {
    padding: "6px 12px",
    borderRadius: 8,
    background: "#1f2937",
    border: "none",
    color: "white",
    cursor: "pointer",
  },
};