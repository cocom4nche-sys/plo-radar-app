import { useEffect, useState, useRef } from "react";
import { supabase } from "./supabaseClient";

const categories = ["PREFLOP", "2BP", "3BP", "4BP", "READS"];

export default function HandsReview() {
  const [selectedCategory, setSelectedCategory] = useState("PREFLOP");
  const [hands, setHands] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [onlyAnki, setOnlyAnki] = useState(false);
  const fileInputRef = useRef();

  const fetchHands = async () => {
    const { data, error } = await supabase
      .from("hands_review")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setHands(data || []);
  };

  useEffect(() => {
    fetchHands();
  }, []);

  const uploadFile = async (file) => {
    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;

    await supabase.storage.from("hands-review").upload(fileName, file);

    const { data } = supabase.storage
      .from("hands-review")
      .getPublicUrl(fileName);

    await supabase.from("hands_review").insert([
      {
        category: selectedCategory,
        image_url: data.publicUrl,
        anki: false,
      },
    ]);

    fetchHands();
  };

  const toggleAnki = async (hand) => {
    await supabase
      .from("hands_review")
      .update({ anki: !hand.anki })
      .eq("id", hand.id);

    fetchHands();
  };

  const deleteHand = async (hand) => {
    // 🔥 Confirmation supprimée

    const path = hand.image_url.split("/hands-review/")[1];

    await supabase.storage.from("hands-review").remove([path]);
    await supabase.from("hands_review").delete().eq("id", hand.id);

    fetchHands();
  };

  const getCategoryStats = (cat) => {
    const categoryHands = hands.filter((h) => h.category === cat);
    const total = categoryHands.length;
    const ankiCount = categoryHands.filter((h) => h.anki).length;
    return { total, ankiCount };
  };

  const getFilteredHands = (cat) => {
    let filtered = hands.filter((h) => h.category === cat);
    if (onlyAnki) {
      filtered = filtered.filter((h) => h.anki);
    }
    return filtered;
  };

  return (
    <>
      <div className="hr-container">
        <h1>PLO Radar — Hand Review</h1>

        <div className="top-controls">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>

          <label className="only-anki-toggle">
            <input
              type="checkbox"
              checked={onlyAnki}
              onChange={() => setOnlyAnki(!onlyAnki)}
            />
            Only Anki
          </label>
        </div>

        <div
          className="hr-dropzone"
          onClick={() => fileInputRef.current.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files[0];
            uploadFile(file);
          }}
        >
          Drag & Drop image or click to upload
          <input
            type="file"
            ref={fileInputRef}
            hidden
            onChange={(e) => uploadFile(e.target.files[0])}
          />
        </div>

        {categories.map((cat) => {
          const stats = getCategoryStats(cat);
          const filteredHands = getFilteredHands(cat);

          if (onlyAnki && stats.ankiCount === 0) return null;

          return (
            <div key={cat} className="hr-section">
              <h2>
                {cat} ({stats.total})
                {stats.ankiCount > 0 && (
                  <span className="anki-counter">
                    {" "}
                    | Anki : {stats.ankiCount}
                  </span>
                )}
              </h2>

              <div className="hr-grid">
                {filteredHands.map((hand) => (
                  <div key={hand.id} className="hr-card">
                    <img
                      src={hand.image_url}
                      alt=""
                      onClick={() => setSelectedImage(hand.image_url)}
                    />

                    <div className="hr-actions">
                      <label className="anki-label">
                        <input
                          type="checkbox"
                          checked={hand.anki}
                          onChange={() => toggleAnki(hand)}
                        />
                        Anki
                      </label>

                      <button
                        className="delete-btn"
                        onClick={() => deleteHand(hand)}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedImage && (
        <div className="hr-overlay" onClick={() => setSelectedImage(null)}>
          <div className="hr-popup" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="" />
          </div>
        </div>
      )}
    </>
  );
}