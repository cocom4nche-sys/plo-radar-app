import { useEffect, useState, useMemo } from "react";
import { supabase } from "./supabaseClient";

const STATUS_OPTIONS = [
  { value: "open", label: "À corriger" },
  { value: "working", label: "En travail" },
  { value: "fixed", label: "Maîtrisé" },
];

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [spots, setSpots] = useState([]);

  const [filterStatus, setFilterStatus] = useState("all");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (activeSession) fetchSpots();
  }, [activeSession]);

  async function fetchSessions() {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false });

    setSessions(data || []);
    setLoading(false);
  }

  async function fetchSpots() {
    const { data } = await supabase
      .from("session_spots")
      .select("*")
      .eq("session_id", activeSession.id)
      .order("created_at", { ascending: false });

    setSpots(data || []);
  }

  async function createSession() {
    await supabase.from("sessions").insert([
      { created_at: new Date().toISOString() },
    ]);
    fetchSessions();
  }

  async function addSpot() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("session_spots").insert([
      {
        session_id: activeSession.id,
        user_id: user.id,
        created_at: new Date().toISOString(),
        title: "Nouveau spot",
        status: "open",
        mastery_level: 0,
      },
    ]);

    fetchSpots();
  }

  async function updateSpot(id, updates) {
    await supabase.from("session_spots").update(updates).eq("id", id);
    fetchSpots();
  }

  async function deleteSpot(id) {
    await supabase.from("session_spots").delete().eq("id", id);
    fetchSpots();
  }

  async function confirmDeleteSession() {
    if (!sessionToDelete) return;

    await supabase.from("sessions").delete().eq("id", sessionToDelete);

    if (activeSession?.id === sessionToDelete) {
      setActiveSession(null);
      setSpots([]);
    }

    setShowDeleteModal(false);
    setSessionToDelete(null);
    fetchSessions();
  }

  const filteredSpots = useMemo(() => {
    return spots.filter((spot) => {
      return filterStatus === "all" || spot.status === filterStatus;
    });
  }, [spots, filterStatus]);

  const statusCounts = useMemo(() => {
    return {
      open: spots.filter((s) => s.status === "open").length,
      working: spots.filter((s) => s.status === "working").length,
      fixed: spots.filter((s) => s.status === "fixed").length,
    };
  }, [spots]);

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <h2>Session Debrief</h2>

      <button
        onClick={createSession}
        style={{
          background: "#a855f7",
          color: "white",
          padding: "8px 14px",
          borderRadius: 6,
          border: "none",
          cursor: "pointer",
          marginBottom: 15,
        }}
      >
        Nouvelle session
      </button>

      {!loading &&
        sessions.map((session) => {
          const isActive = activeSession?.id === session.id;

          return (
            <div
              key={session.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 14,
                marginBottom: 10,
                background: isActive ? "#2a3350" : "#1e293b",
                borderRadius: 8,
                border: isActive
                  ? "2px solid #a855f7"
                  : "2px solid transparent",
                boxShadow: isActive
                  ? "0 0 12px rgba(168,85,247,0.4)"
                  : "none",
                transition: "all 0.2s ease",
              }}
            >
              <div
                onClick={() => setActiveSession(session)}
                style={{ cursor: "pointer" }}
              >
                Session du{" "}
                {new Date(session.created_at).toLocaleDateString()}
              </div>

              <button
                onClick={() => {
                  setSessionToDelete(session.id);
                  setShowDeleteModal(true);
                }}
                style={{
                  background: "#ef4444",
                  color: "white",
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Supprimer
              </button>
            </div>
          );
        })}

      {activeSession && (
        <div style={{ marginTop: 30 }}>
          <h3>Spots de la session</h3>

          <div style={{ marginBottom: 15 }}>
            <strong>À corriger:</strong> {statusCounts.open} |{" "}
            <strong>En travail:</strong> {statusCounts.working} |{" "}
            <strong>Maîtrisé:</strong> {statusCounts.fixed}
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <button
            onClick={addSpot}
            style={{
              background: "#22c55e",
              color: "white",
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              marginLeft: 10,
            }}
          >
            Ajouter un spot
          </button>

          {filteredSpots.map((spot) => (
            <div
              key={spot.id}
              style={{
                marginTop: 20,
                padding: 15,
                background: "#1e293b",
                borderRadius: 8,
              }}
            >
              <input
                value={spot.title || ""}
                onChange={(e) =>
                  updateSpot(spot.id, { title: e.target.value })
                }
                style={{ width: "100%", marginBottom: 10 }}
              />

              <select
                value={spot.status || "open"}
                onChange={(e) =>
                  updateSpot(spot.id, { status: e.target.value })
                }
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              <input
                type="range"
                min="0"
                max="100"
                value={spot.mastery_level || 0}
                onChange={(e) =>
                  updateSpot(spot.id, {
                    mastery_level: parseInt(e.target.value),
                  })
                }
                style={{ width: "100%", marginTop: 10 }}
              />

              <button
                onClick={() => deleteSpot(spot.id)}
                style={{
                  background: "#ef4444",
                  color: "white",
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  marginTop: 10,
                }}
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}

      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#0f172a",
              padding: 30,
              borderRadius: 12,
              width: 400,
              textAlign: "center",
            }}
          >
            <h3>Supprimer cette session ?</h3>

            <p style={{ color: "#94a3b8" }}>
              Tous les spots liés seront supprimés définitivement.
            </p>

            <div
              style={{
                marginTop: 20,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSessionToDelete(null);
                }}
                style={{
                  background: "#334155",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>

              <button
                onClick={confirmDeleteSession}
                style={{
                  background: "#ef4444",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}