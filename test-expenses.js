const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, limit, query } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "default");

async function test() {
  const snap = await getDocs(query(collection(db, "expenses"), limit(3)));
  snap.forEach(d => console.log(d.id, d.data()));
  console.log("Done");
}
test();
