const pool = require("../config/db");

async function createSession(userId, tokenHash, expiresAt) {
  const result = await pool.query(
    `INSERT INTO sessions (user_id, token_hash, expires_at, revoked)
     VALUES ($1, $2, $3, false)
     RETURNING *`,
    [userId, tokenHash, expiresAt]
  );

  return result.rows[0];
}

async function getValidSessionByTokenHash(tokenHash) {
  const result = await pool.query(
    `SELECT s.*, u.email, u.status
     FROM sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1
       AND s.revoked = false
     LIMIT 1`,
    [tokenHash]
  );

  return result.rows[0];
}

async function revokeAllUserSessions(userId) {
  await pool.query(
    `UPDATE sessions
     SET revoked = true
     WHERE user_id = $1`,
    [userId]
  );
}

async function revokeSessionByTokenHash(tokenHash) {
  await pool.query(
    `UPDATE sessions
     SET revoked = true
     WHERE token_hash = $1`,
    [tokenHash]
  );
}

module.exports = {
  createSession,
  getValidSessionByTokenHash,
  revokeAllUserSessions,
  revokeSessionByTokenHash,
};