import { useState } from "react";
import PlayersPage from "./PlayersPage";
import HandsReview from "./HandsReview";

export default function App() {
  const [page, setPage] = useState("players");

  return (
    <>
      <div style={{
        display: "flex",
        gap: 10,
        padding: 15,
        background: "#0b1220",
        borderBottom: "1px solid rgba(255,255,255,0.05)"
      }}>
        <button
          onClick={() => setPage("players")}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background: page === "players" ? "#22c55e" : "#1e293b",
            color: "white"
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
            color: "white"
          }}
        >
          Hand Review
        </button>
      </div>

      {page === "players" && <PlayersPage />}
      {page === "review" && <HandsReview />}
    </>
  );
}