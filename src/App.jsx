import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import PlayersPage from "./PlayersPage";
import HandsReview from "./HandsReview";
import Login from "./Login";

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

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div style={{ color: "white", padding: 20, background: "#0b1220", minHeight: "100vh" }}>
        Loading...
      </div>
    );
  }

  if (!session) {
    return <Login />;
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
          onClick={async () => {
            await supabase.auth.signOut();
          }}
          style={{
            marginLeft: "auto",
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

      {page === "players" && <PlayersPage />}
      {page === "review" && <HandsReview />}
    </>
  );
}