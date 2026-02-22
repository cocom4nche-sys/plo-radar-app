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

export default function App() {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const [toolWidth, setToolWidth] = useState(360);
  const resizing = useRef(false);
  const fileInputRef = useRef(null);

  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [exploit, setExploit] = useState("");

  const [images, setImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const [notes, setNotes] = useState({
    preflop: "",
    twobp: "",
    threebp: "",
  });

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    const { data } = await supabase
      .from("players")
      .select("*")
      .order("created_at", { ascending: false });

    setPlayers(data || []);
  }

  function resetForm() {
    setSelectedPlayer(null);
    setName("");
    setColor(COLORS[0]);
    setExploit("");
    setImages([]);
    setSelectedImageIndex(null);
    setNotes({ preflop: "", twobp: "", threebp: "" });
  }

  async function savePlayer() {
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      color,
      exploit,
      preflop: notes.preflop,
      twobp: notes.twobp,
      threebp: notes.threebp,
      statsimages: images,
    };

    if (selectedPlayer) {
      await supabase
        .from("players")
        .update(payload)
        .eq("id", selectedPlayer.id);
    } else {
      const { data } = await supabase
        .from("players")
        .insert([payload])
        .select()
        .single();

      setSelectedPlayer(data);
    }

    await fetchPlayers();
  }

  async function deletePlayer() {
    if (!selectedPlayer) return;

    if (!window.confirm("Supprimer ce joueur définitivement ?")) return;

    await supabase
      .from("players")
      .delete()
      .eq("id", selectedPlayer.id);

    await fetchPlayers();
    resetForm();
  }

  async function uploadFile(file) {
    if (!selectedPlayer) {
      alert("Crée ou sélectionne un joueur avant d'upload.");
      return;
    }

    const fileName = `${Date.now()}-${file.name}`;

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
    setSelectedImageIndex(updatedImages.length - 1);

    await supabase
      .from("players")
      .update({ statsimages: updatedImages })
      .eq("id", selectedPlayer.id);
  }

  async function removeImage(index) {
    if (!selectedPlayer) return;

    const updated = images.filter((_, i) => i !== index);

    setImages(updated);
    setSelectedImageIndex(null);

    await supabase
      .from("players")
      .update({ statsimages: updated })
      .eq("id", selectedPlayer.id);
  }

  function selectPlayer(player) {
    setSelectedPlayer(player);
    setName(player.name);
    setColor(player.color ?? COLORS[0]);
    setExploit(player.exploit || "");
    setImages(player.statsimages || []);
    setSelectedImageIndex(null);
    setNotes({
      preflop: player.preflop || "",
      twobp: player.twobp || "",
      threebp: player.threebp || "",
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
                border: `1px solid ${player.color || "#334155"}`,
              }}
            >
              {player.name}
            </div>
          ))}
      </div>

      <div style={styles.main}>
        <div style={styles.header}>
          <div style={{ ...styles.dot, background: color }} />
          <h2 style={styles.title}>
            {selectedPlayer ? selectedPlayer.name : "NOUVEAU JOUEUR"}
          </h2>
        </div>

        <div style={styles.topBar}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du joueur"
            style={{ ...styles.input, borderColor: color }}
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

          <button onClick={resetForm} style={styles.btnGhost}>Nouveau</button>
          <button onClick={savePlayer} style={styles.btnPrimary}>Sauvegarder</button>

          {selectedPlayer && (
            <button onClick={deletePlayer} style={styles.btnDanger}>
              Supprimer
            </button>
          )}
        </div>

        <NoteCard title="EXPLOIT" value={exploit} onChange={setExploit} small />
        <NoteCard title="PREFLOP" value={notes.preflop} onChange={(v)=>setNotes({...notes,preflop:v})}/>
        <NoteCard title="2BP" value={notes.twobp} onChange={(v)=>setNotes({...notes,twobp:v})}/>
        <NoteCard title="3BP" value={notes.threebp} onChange={(v)=>setNotes({...notes,threebp:v})}/>
      </div>

      <div style={styles.tool}>
        <div style={styles.uploadTitle}>IMAGES</div>

        <div
          onClick={() => fileInputRef.current.click()}
          onDragOver={(e)=>{e.preventDefault();setDragOver(true);}}
          onDragLeave={()=>setDragOver(false)}
          onDrop={handleDrop}
          style={{
            ...styles.uploadBox,
            border: dragOver ? "2px solid #22c55e" : "1px dashed rgba(255,255,255,0.2)",
          }}
        >
          Drop images here or click
          <input
            ref={fileInputRef}
            type="file"
            hidden
            multiple
            onChange={(e)=>Array.from(e.target.files).forEach(uploadFile)}
          />
        </div>

        <div style={styles.thumbGrid}>
          {images.map((img,index)=>(
            <img
              key={index}
              src={img}
              onClick={()=>setSelectedImageIndex(index)}
              style={styles.thumb}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function NoteCard({title,value,onChange,small}){
  return(
    <div style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      <textarea
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        style={small?styles.textareaSmall:styles.textarea}
      />
    </div>
  );
}

const styles = {
  layout:{display:"flex",minHeight:"100vh",background:"#0b1220",color:"white"},
  sidebar:{padding:20,background:"#111827"},
  sidebarHeader:{display:"flex",justifyContent:"space-between",marginBottom:20,fontSize:12},
  toggleBtn:{background:"none",border:"none",color:"#9ca3af",cursor:"pointer"},
  playerItem:{padding:10,borderRadius:12,marginBottom:10,background:"rgba(255,255,255,0.03)",cursor:"pointer"},
  main:{flex:1,padding:40},
  tool:{padding:20,borderLeft:"1px solid rgba(255,255,255,0.05)"},
  uploadTitle:{marginBottom:12,fontSize:14,color:"#94a3b8"},
  uploadBox:{display:"flex",justifyContent:"center",alignItems:"center",height:80,borderRadius:12,cursor:"pointer",marginBottom:20},
  thumbGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,90px)",gap:12},
  thumb:{width:90,height:90,objectFit:"cover",borderRadius:8},
  header:{display:"flex",alignItems:"center",gap:10,marginBottom:20},
  dot:{width:10,height:10,borderRadius:"50%"},
  title:{margin:0},
  topBar:{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"},
  input:{padding:8,borderRadius:10,background:"#0f172a",color:"white",border:"1px solid"},
  colorRow:{display:"flex",gap:6},
  colorDot:{width:18,height:18,borderRadius:"50%",cursor:"pointer"},
  card:{background:"rgba(255,255,255,0.03)",padding:20,borderRadius:16,marginBottom:20},
  cardTitle:{fontSize:12,marginBottom:8,color:"#94a3b8"},
  textarea:{width:"100%",height:120,borderRadius:10,padding:10,background:"#0f172a",color:"white",border:"1px solid rgba(255,255,255,0.08)",resize:"none"},
  textareaSmall:{width:"100%",height:80,borderRadius:10,padding:10,background:"#0f172a",color:"white",border:"1px solid rgba(255,255,255,0.08)",resize:"none"},
  btnGhost:{padding:"6px 12px",borderRadius:8,background:"#1f2937",border:"none",color:"white",cursor:"pointer"},
  btnPrimary:{padding:"6px 12px",borderRadius:8,background:"#22c55e",border:"none",color:"white",cursor:"pointer"},
  btnDanger:{padding:"6px 12px",borderRadius:8,background:"#ef4444",border:"none",color:"white",cursor:"pointer"},
};