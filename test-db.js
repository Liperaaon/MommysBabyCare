const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "default");

async function test() {
  try {
    const snap = await getDocs(collection(db, "test"));
    console.log("Success! Docs:", snap.size);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
test();
