import { useEffect, useState, useRef } from "react";
import { supabase } from "./supabaseClient";

const categories = ["PREFLOP", "2BP", "3BP", "4BP", "READS"];

export default function HandsReview() {
  const [hands, setHands] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [onlyAnki, setOnlyAnki] = useState(false);
  const [uploadCategory, setUploadCategory] = useState(null);

  const fileInputRef = useRef();

  useEffect(() => {
    fetchHands();
  }, []);

  const fetchHands = async () => {
    const { data, error } = await supabase
      .from("hands_review")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setHands(data || []);
  };

  const uploadFile = async (file, category) => {
    if (!file || !category) return;

    const fileName = `${Date.now()}-${file.name}`;

    // 1️⃣ Upload storage
    const { error: uploadError } = await supabase.storage
      .from("hands-review")
      .upload(fileName, file);

    if (uploadError) {
      alert(uploadError.message);
      return;
    }

    // 2️⃣ Get public URL
    const { data } = supabase.storage
      .from("hands-review")
      .getPublicUrl(fileName);

    // 3️⃣ Insert DB
    const { error: insertError } = await supabase
      .from("hands_review")
      .insert([
        {
          category: category,
          image_url: data.publicUrl,
          anki: false,
        },
      ]);

    if (insertError) {
      alert(insertError.message);
      return;
    }

    fetchHands();
  };

  const toggleAnki = async (hand) => {
    const { error } = await supabase
      .from("hands_review")
      .update({ anki: !hand.anki })
      .eq("id", hand.id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchHands();
  };

  const deleteHand = async (hand) => {
    const path = hand.image_url.split("/hands-review/")[1];

    await supabase.storage.from("hands-review").remove([path]);
    await supabase.from("hands_review").delete().eq("id", hand.id);

    fetchHands();
  };

  const getCategoryHands = (cat) => {
    let filtered = hands.filter((h) => h.category === cat);

    if (onlyAnki) {
      filtered = filtered.filter((h) => h.anki);
    }

    return filtered;
  };

  return (
    <>
      <div style={{ padding: 30, color: "white" }}>
        <h1>PLO Radar — Hand Review</h1>

        <label>
          <input
            type="checkbox"
            checked={onlyAnki}
            onChange={() => setOnlyAnki(!onlyAnki)}
          />
          {" "}Only Anki
        </label>

        {categories.map((cat) => {
          const catHands = getCategoryHands(cat);

          return (
            <div key={cat} style={{ marginTop: 40 }}>
              <h2>
                {cat} ({catHands.length})
              </h2>

              {/* DROP ZONE */}
              <div
                style={{
                  border: "1px dashed rgba(255,255,255,0.2)",
                  padding: 20,
                  borderRadius: 8,
                  cursor: "pointer",
                  marginBottom: 20,
                }}
                onClick={() => {
                  setUploadCategory(cat);
                  fileInputRef.current.click();
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  uploadFile(file, cat);
                }}
              >
                Drop image or click to upload
              </div>

              {/* GRID */}
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {catHands.map((hand) => (
                  <div
                    key={hand.id}
                    style={{
                      width: 200,
                      background: "#0f1a2e",
                      borderRadius: 10,
                      padding: 10,
                    }}
                  >
                    <img
                      src={hand.image_url}
                      alt=""
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                      onClick={() => setSelectedImage(hand.image_url)}
                    />

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 10,
                      }}
                    >
                      <label>
                        <input
                          type="checkbox"
                          checked={hand.anki}
                          onChange={() => toggleAnki(hand)}
                        />
                        {" "}Anki
                      </label>

                      <button onClick={() => deleteHand(hand)}>
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

      {/* SINGLE FILE INPUT (IMPORTANT FIX) */}
      <input
        type="file"
        hidden
        ref={fileInputRef}
        onChange={(e) => {
          if (!uploadCategory) return;
          uploadFile(e.target.files[0], uploadCategory);
        }}
      />

      {/* IMAGE POPUP */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={selectedImage}
            alt=""
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: 10,
            }}
          />
        </div>
      )}
    </>
  );
}