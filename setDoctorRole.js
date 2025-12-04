import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// UID for doctor access 
const doctorUIDs = [
                                      // me
  "haefJFt0w4TYZEAkfP4yYKMkoaR2",   // PM 
  // Add more here when needed
];

// Assign doctor role to each UID
async function setDoctorRoles() {
  for (const uid of doctorUIDs) {
    try {
      await admin.auth().setCustomUserClaims(uid, { role: "doctor" });
      console.log(`✔ Doctor role assigned to: ${uid}`);
    } catch (error) {
      console.error(`❌ Error assigning role to ${uid}:`, error);
    }
  }
}

setDoctorRoles();
