// One-off admin utility: list users or reset a user's password.
// Usage:
//   node reset-password.js                      -> list all users
//   node reset-password.js <username> <newpass> -> reset that user's password
// Run from the backend/ directory (relies on .env.local and config/ca.pem).

const bcrypt = require("bcryptjs");
const db = require("./config/database");

const SALT_ROUNDS = 12;

async function main() {
  const [, , username, newPassword] = process.argv;

  if (!username) {
    const { rows } = await db.query(
      "SELECT id, username, role, last_login FROM users ORDER BY id"
    );
    console.log("\nUsers:");
    rows.forEach((u) =>
      console.log(
        `  #${u.id}  ${u.username}  (${u.role})  last_login=${u.last_login ?? "never"}`
      )
    );
    console.log(
      "\nTo reset: node reset-password.js <username> <newPassword>\n"
    );
    return;
  }

  if (!newPassword || newPassword.length < 8) {
    console.error("New password is required and must be at least 8 characters.");
    process.exitCode = 1;
    return;
  }

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const { rows } = await db.query(
    "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE username = $2 RETURNING id, username, role",
    [hashed, username]
  );

  if (rows.length === 0) {
    console.error(`No user found with username "${username}".`);
    process.exitCode = 1;
    return;
  }

  console.log(`Password reset for ${rows[0].username} (${rows[0].role}).`);
}

main()
  .catch((err) => {
    console.error("Error:", err.message);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
