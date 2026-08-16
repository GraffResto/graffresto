// Grant Platform Admin to an account.
//
// The client app cannot do this on purpose: firestore.rules only lets a user
// create a profile with role 'customer' or 'partner', and changing `role`
// requires an existing admin. Bootstrapping therefore has to happen with the
// Admin SDK, which bypasses the rules.
//
// Usage:
//   npm i -D firebase-admin
//   # download a service account key: Firebase console -> Project settings ->
//   # Service accounts -> Generate new private key, save as serviceAccountKey.json
//   node scripts/make-admin.mjs <email> [password]
//
// If the account does not exist yet it is created with the given password
// (default: prompt to pass one). If it already exists, only the role is raised.

import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const [email, password] = process.argv.slice(2);

if (!email) {
  console.error("Usage: node scripts/make-admin.mjs <email> [password]");
  process.exit(1);
}

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || "./serviceAccountKey.json";

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));
} catch {
  console.error(
    `Could not read the service account key at ${keyPath}.\n` +
      "Firebase console -> Project settings -> Service accounts -> Generate new private key."
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const db = getFirestore();

let user;
try {
  user = await auth.getUserByEmail(email);
  console.log(`Found existing account ${email} (${user.uid}).`);
  if (password) {
    await auth.updateUser(user.uid, { password });
    console.log(`Updated password for ${email}.`);
  }
} catch (err) {
  if (err.code !== "auth/user-not-found") throw err;

  if (!password) {
    console.error(`${email} has no account yet — pass a password to create one:\n` +
      `  node scripts/make-admin.mjs ${email} "YourPassword123"`);
    process.exit(1);
  }

  user = await auth.createUser({ email, password, emailVerified: true });
  console.log(`Created account ${email} (${user.uid}).`);
}

// The admin login screen reads profiles/{uid}.role, so that document is what
// actually grants access. Skipping email verification here keeps the new admin
// from bouncing to /auth/check-email on first sign-in.
if (!user.emailVerified) {
  await auth.updateUser(user.uid, { emailVerified: true });
  console.log("Marked the email as verified.");
}

const profileRef = db.collection("profiles").doc(user.uid);
const existing = await profileRef.get();

await profileRef.set(
  {
    uid: user.uid,
    email,
    full_name: existing.data()?.full_name || "Platform Admin",
    phone: existing.data()?.phone || "",
    role: "admin",
    created_at: existing.data()?.created_at || new Date().toISOString(),
  },
  { merge: true }
);

// Registration screens keep a legacy mirror in `users`; keep the two in sync.
await db.collection("users").doc(user.uid).set({ uid: user.uid, email, role: "admin" }, { merge: true });

console.log(`\n${email} is now a Platform Admin. Sign in at /admin/login.`);
process.exit(0);
