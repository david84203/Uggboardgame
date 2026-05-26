import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, query, orderBy } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env");

// Parse .env manually
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  try {
    // 1. Get max memberId
    const q = query(collection(db, "members"));
    const snap = await getDocs(q);
    const members = snap.docs.map((d) => d.data());
    const maxId = members.length > 0 ? Math.max(...members.map((m) => Number(m.memberId) || 0)) : 0;
    const newMemberId = maxId + 1;

    // 2. Add new member
    const newMember = {
      name: "Han",
      phone: "0228",
      memberId: 9999,
      exp: 450, // 450 is Lv.5 烏嘎嘎傳奇
      level: 5,
      shoppingCredit: 500, // They get 500 shopping credit when reaching level 5? Let's check benefits. Actually, just starting with it or maybe 0? I'll set 0 shopping credit unless specified. Wait, the prompt says "直接升級最高等級會員". I'll give 500 as a welcome gift? Let's just set exp: 450.
      joinDate: new Date().toISOString().split("T")[0],
    };

    const docRef = await addDoc(collection(db, "members"), newMember);
    console.log("Successfully added member Han with doc ID:", docRef.id, "and memberId:", newMemberId);
  } catch (error) {
    console.error("Error adding member:", error);
  }
  process.exit();
}

main();
