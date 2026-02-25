import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import PlayersPage from "./PlayersPage";
import HandsReview from "./HandsReview";
import SessionsPage from "./SessionsPage";
import Login from "./login";

export default function App() {
  const [page, setPage] = useState("players");
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (loading) return null;

  if (!session) {
    return <Login onLogin={setSession} />;
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 10,
          padding: 15,
          background: "#0b1220",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <button
          onClick={() => setPage("players")}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background: page === "players" ? "#22c55e" : "#1e293b",
            color: "white",
          }}
        >
          PLO Radar
        </button>

        <button
          onClick={() => setPage("review")}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background: page === "review" ? "#3b82f6" : "#1e293b",
            color: "white",
          }}
        >
          Hand Review
        </button>

        <button
          onClick={() => setPage("sessions")}
          style={{
            padding: "6px 12px",
            border: "none",
            cursor: "pointer",
            borderRadius: 8,
            background: page === "sessions" ? "#a855f7" : "#1e293b",
            color: "white",
          }}
        >
          Session Debrief
        </button>

        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: "#ef4444",
              color: "white",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {page === "players" && <PlayersPage />}
      {page === "review" && <HandsReview />}
      {page === "sessions" && <SessionsPage />}
    </>
  );
}