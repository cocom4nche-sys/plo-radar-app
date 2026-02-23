import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

const folderPath = "./import-players";
const bucketName = "tracker-images";

async function updatePlayersImages() {
  try {
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      if (!file.endsWith(".png")) continue;

      const playerName = path.parse(file).name;
      const filePath = path.join(folderPath, file);
      const fileBuffer = fs.readFileSync(filePath);

      console.log(`⬆️ Uploading ${playerName}...`);

      // Upload image
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(`${playerName}.png`, fileBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        console.error(`❌ Upload error for ${playerName}:`, uploadError.message);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(`${playerName}.png`);

      const publicUrl = publicUrlData.publicUrl;

      // UPDATE instead of INSERT
      const { error: updateError } = await supabase
        .from("players")
        .update({
          statsimages: [publicUrl]
        })
        .eq("name", playerName);

      if (updateError) {
        console.error(`❌ Update error for ${playerName}:`, updateError.message);
        continue;
      }

      console.log(`✅ Updated ${playerName}`);
    }

    console.log("🎉 UPDATE TERMINÉ !");
  } catch (err) {
    console.error("💥 Erreur globale :", err.message);
  }
}

updatePlayersImages();