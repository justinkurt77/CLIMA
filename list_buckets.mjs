import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envContent = fs.readFileSync(".env", "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || "";
    if (
      val.length > 0 &&
      val.charAt(0) === '"' &&
      val.charAt(val.length - 1) === '"'
    ) {
      val = val.replace(/\\n/gm, "\n");
    }
    env[key] = val.replace(/(^['"]|['"]$)/g, "").trim();
  }
});

const supabaseUrl = env["VITE_SUPABASE_URL"];
const supabaseAnonKey = env["VITE_SUPABASE_ANON_KEY"];
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) console.error("Error listing buckets:", error);
  else
    console.log(
      "Buckets:",
      data.map((b) => b.name),
    );
}

check();
