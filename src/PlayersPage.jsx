import { useEffect, useState, useRef } from "react";
import { supabase } from "./supabaseClient";

const COLORS = [
  "#22c55e",
  "#3b82f6",
  "#ef4444",
  "#f59e0b",
  "#a855f7",
  "#ec4899",
];

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);

  const fileInputRef = useRef(null);
  const saveTimeout = useRef(null);

  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [color, setColor] = useState(null);
  const [exploit, setExploit] = useState("");

  const [images, setImages] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const [notes, setNotes] = useState({
    preflop: "",
    bp2: "",
    bp3: "",
  });

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) fetchPlayers(data.user.id);
  }

  async function fetchPlayers(userId) {
    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setPlayers(data || []);
  }

  function resetForm() {
    setSelectedPlayer(null);
    setName("");
    setColor(null);
    setExploit("");
    setImages([]);
    setNotes({ preflop: "", bp2: "", bp3: "" });
  }

  async function createPlayer() {
    if (!name.trim() || !user) return;

    const payload = {
      name: name.trim(),
      color,
      exploit,
      preflop: notes.preflop,
      bp2: notes.bp2,
      bp3: notes.bp3,
      statsimages: [],
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from("players")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Erreur création joueur");
      return;
    }

    setSelectedPlayer(data);
    setImages([]);
    await fetchPlayers(user.id);
  }

  function autoSave() {
    if (!selectedPlayer) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    setIsSaving(true);

    saveTimeout.current = setTimeout(async () => {
      await supabase
        .from("players")
        .update({
          name,
          color,
          exploit,
          preflop: notes.preflop,
          bp2: notes.bp2,
          bp3: notes.bp3,
        })
        .eq("id", selectedPlayer.id);

      setIsSaving(false);
      await fetchPlayers(user.id);
    }, 800);
  }

  useEffect(() => {
    autoSave();
  }, [name, color, exploit, notes]);

  async function deletePlayer() {
    if (!selectedPlayer) return;
    if (!window.confirm("Supprimer ce joueur définitivement ?")) return;

    await supabase.from("players").delete().eq("id", selectedPlayer.id);
    await fetchPlayers(user.id);
    resetForm();
  }

  async function uploadFile(file) {
    if (!selectedPlayer) {
      alert("Crée le joueur avant d'upload.");
      return;
    }

    const fileName = `${selectedPlayer.id}/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("tracker-images")
      .upload(fileName, file);

    if (error) {
      alert("Erreur upload storage");
      return;
    }

    const { data } = supabase.storage
      .from("tracker-images")
      .getPublicUrl(fileName);

    const updatedImages = [...images, data.publicUrl];

    setImages(updatedImages);

    await supabase
      .from("players")
      .update({ statsimages: updatedImages })
      .eq("id", selectedPlayer.id);
  }

  // 🔥 FIX COMPLET SUPPRESSION IMAGE
  async function removeImage(index) {
    if (!selectedPlayer) return;

    const imageUrl = images[index];

    const filePath = imageUrl.split("/tracker-images/")[1];

    await supabase.storage
      .from("tracker-images")
      .remove([filePath]);

    const updated = images.filter((_, i) => i !== index);
    setImages(updated);

    await supabase
      .from("players")
      .update({ statsimages: updated })
      .eq("id", selectedPlayer.id);
  }

  // 🔥 FIX SELECT PLAYER (reload propre depuis DB)
  async function selectPlayer(player) {
    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("id", player.id)
      .single();

    setSelectedPlayer(data);
    setName(data.name);
    setColor(data.color || null);
    setExploit(data.exploit || "");
    setImages(data.statsimages || []);
    setNotes({
      preflop: data.preflop || "",
      bp2: data.bp2 || "",
      bp3: data.bp3 || "",
    });
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    Array.from(e.dataTransfer.files).forEach(uploadFile);
  }

  return (
    <div style={styles.layout}>
      <div style={{ ...styles.sidebar, width: collapsed ? 60 : 240 }}>
        <div style={styles.sidebarHeader}>
          {!collapsed && <span>HISTORIQUE</span>}
          <button onClick={() => setCollapsed(!collapsed)} style={styles.toggleBtn}>
            {collapsed ? "▶" : "◀"}
          </button>
        </div>

        {!collapsed &&
          players.map((player) => (
            <div
              key={player.id}
              onClick={() => selectPlayer(player)}
              style={{
                ...styles.playerItem,
                border: player.color
                  ? `1px solid ${player.color}`
                  : "1px solid #334155",
              }}
            >
              {player.name}
            </div>
          ))}
      </div>

      <div style={styles.main}>
        <div style={styles.header}>
          {color && <div style={{ ...styles.dot, background: color }} />}
          <h2>{selectedPlayer ? selectedPlayer.name : "Créer joueur"}</h2>
          {selectedPlayer && (
            <div style={styles.saveIndicator}>
              {isSaving ? "Sauvegarde..." : "✓ Sauvegardé"}
            </div>
          )}
        </div>

        <div style={styles.topBar}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du joueur"
            style={styles.input}
          />

          <div style={styles.colorRow}>
            {COLORS.map((c) => (
              <div
                key={c}
                onClick={() => setColor(c)}
                style={{
                  ...styles.colorDot,
                  background: c,
                  border: color === c ? "2px solid white" : "none",
                }}
              />
            ))}
          </div>

          <button
            onClick={() => {
              if (selectedPlayer) resetForm();
              else createPlayer();
            }}
            style={styles.btnPrimary}
          >
            Créer joueur
          </button>

          {selectedPlayer && (
            <button onClick={deletePlayer} style={styles.btnDanger}>
              Supprimer
            </button>
          )}
        </div>

        <NoteCard title="EXPLOIT" value={exploit} onChange={setExploit} small />
        <NoteCard title="PREFLOP" value={notes.preflop} onChange={(v) => setNotes({ ...notes, preflop: v })} />
        <NoteCard title="2BP" value={notes.bp2} onChange={(v) => setNotes({ ...notes, bp2: v })} />
        <NoteCard title="3BP" value={notes.bp3} onChange={(v) => setNotes({ ...notes, bp3: v })} />
      </div>

      <div style={styles.tool}>
        <div style={styles.uploadTitle}>IMAGES</div>

        <div
          onClick={() => fileInputRef.current.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            ...styles.uploadBox,
            border: dragOver
              ? "2px solid #22c55e"
              : "1px dashed rgba(255,255,255,0.2)",
          }}
        >
          Drop images here or click
          <input
            ref={fileInputRef}
            type="file"
            hidden
            multiple
            onChange={(e) =>
              Array.from(e.target.files).forEach(uploadFile)
            }
          />
        </div>

        <div style={styles.thumbGrid}>
          {images.map((img, index) => (
            <div key={index} style={styles.imageWrapper}>
              <img
                src={img}
                style={styles.thumb}
                onClick={() => setPreviewImage(img)}
              />
              <button
                style={styles.deleteImageBtn}
                onClick={() => removeImage(index)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {previewImage && (
        <div
          style={styles.modalOverlay}
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} style={styles.modalImage} />
        </div>
      )}
    </div>
  );
}

function NoteCard({ title, value, onChange, small }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={small ? styles.textareaSmall : styles.textarea}
      />
    </div>
  );
}

const styles = {
  layout: { display: "flex", minHeight: "100vh", background: "#0b1220", color: "white" },
  sidebar: { padding: 20, background: "#111827" },
  sidebarHeader: { display: "flex", justifyContent: "space-between", marginBottom: 20, fontSize: 12 },
  toggleBtn: { background: "none", border: "none", color: "#9ca3af", cursor: "pointer" },
  playerItem: { padding: 10, borderRadius: 12, marginBottom: 10, background: "rgba(255,255,255,0.03)", cursor: "pointer" },
  main: { flex: 1, padding: 40, maxWidth: "900px" },
  tool: { padding: 30, borderLeft: "1px solid rgba(255,255,255,0.05)", width: 480 },
  uploadTitle: { marginBottom: 12, fontSize: 14, color: "#94a3b8" },
  uploadBox: { display: "flex", justifyContent: "center", alignItems: "center", height: 120, borderRadius: 12, cursor: "pointer", marginBottom: 20 },
  thumbGrid: { display: "flex", flexDirection: "column", gap: 20 },
  imageWrapper: { position: "relative", width: "100%" },
  thumb: { width: "100%", height: "auto", borderRadius: 12, cursor: "pointer" },
  deleteImageBtn: { position: "absolute", top: 10, right: 10, background: "rgba(239,68,68,0.9)", border: "none", borderRadius: "50%", width: 28, height: 28, color: "white", cursor: "pointer" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalImage: { maxWidth: "90%", maxHeight: "90%", borderRadius: 16 },
  header: { display: "flex", alignItems: "center", gap: 10, marginBottom: 20 },
  dot: { width: 10, height: 10, borderRadius: "50%" },
  saveIndicator: { marginLeft: "auto", fontSize: 12, color: "#22c55e" },
  topBar: { display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" },
  input: { padding: 8, borderRadius: 10, background: "#0f172a", color: "white", border: "1px solid #334155" },
  colorRow: { display: "flex", gap: 6 },
  colorDot: { width: 18, height: 18, borderRadius: "50%", cursor: "pointer" },
  card: { background: "rgba(255,255,255,0.03)", padding: 20, borderRadius: 16, marginBottom: 20 },
  cardTitle: { fontSize: 12, marginBottom: 8, color: "#94a3b8" },
  textarea: { width: "100%", height: 120, borderRadius: 10, padding: 10, background: "#0f172a", color: "white", border: "1px solid rgba(255,255,255,0.08)", resize: "none" },
  textareaSmall: { width: "100%", height: 80, borderRadius: 10, padding: 10, background: "#0f172a", color: "white", border: "1px solid rgba(255,255,255,0.08)", resize: "none" },
  btnPrimary: { padding: "6px 12px", borderRadius: 8, background: "#22c55e", border: "none", color: "white", cursor: "pointer" },
  btnDanger: { padding: "6px 12px", borderRadius: 8, background: "#ef4444", border: "none", color: "white", cursor: "pointer" },
};