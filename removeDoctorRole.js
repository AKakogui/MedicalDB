import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

//replace uid
const uid = "qIpDwMsVX4PGdQr2loMLWTt2VAr1";

async function removeDoctorRole() {
  try {
    await admin.auth().setCustomUserClaims(uid, {}); // clear roles
    console.log("❌ Doctor role removed from:", uid);
  } catch (error) {
    console.error("Error removing role:", error);
  }
}

removeDoctorRole();
