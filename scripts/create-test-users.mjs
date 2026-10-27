// Creates (or resets) the Playwright test users A and B through Clerk's Backend API and writes their sign-in
// details to the gitignored .env.test.local (AGENTS.md → Testing). Safe to rerun: an existing user gets a new password.
// Self-deletion is switched off per user too: Clerk copies the instance setting onto each user when it is created.
//   node scripts/create-test-users.mjs
import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const secret = process.env.CLERK_SECRET_KEY;
if (!secret?.startsWith("sk_test_")) throw new Error("Set CLERK_SECRET_KEY in .env.local to a development key (sk_test_…)");

const api = async (path, init = {}) => {
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Clerk ${init.method ?? "GET"} ${path} answered ${res.status}: ${JSON.stringify(body.errors ?? body)}`);
  return body;
};

// +clerk_test addresses never receive mail; Clerk accepts 424242 as their verification code.
const users = { A: "bijou-test-a+clerk_test@example.com", B: "bijou-test-b+clerk_test@example.com" };
const lines = ["# Playwright test users, written by scripts/create-test-users.mjs. Never commit this file."];

for (const [name, email] of Object.entries(users)) {
  const password = randomBytes(18).toString("base64url"); // 24 characters
  const [existing] = await api(`/users?email_address=${encodeURIComponent(email)}`);
  const settings = { password, skip_password_checks: true, delete_self_enabled: false };
  const user = existing
    ? await api(`/users/${existing.id}`, { method: "PATCH", body: JSON.stringify(settings) })
    : await api("/users", { method: "POST", body: JSON.stringify({ email_address: [email], ...settings }) });
  console.log(`${existing ? "Reset" : "Created"} test user ${name}: ${email} (${user.id})`);
  lines.push(`TEST_USER_${name}_EMAIL=${email}`, `TEST_USER_${name}_PASSWORD=${password}`);
}

writeFileSync(".env.test.local", `${lines.join("\n")}\n`, { mode: 0o600 });
console.log("Wrote .env.test.local");
