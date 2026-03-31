const pool = require("../config/db");

async function createLoginCode(email, code, expiresAt) {
  const result = await pool.query(
    `INSERT INTO login_codes (email, code, expires_at, used)
     VALUES ($1, $2, $3, false)
     RETURNING *`,
    [email, code, expiresAt]
  );

  return result.rows[0];
}

async function getValidLoginCode(email, code) {
  const result = await pool.query(
    `SELECT *
     FROM login_codes
     WHERE email = $1
       AND code = $2
       AND used = false
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, code]
  );

  return result.rows[0];
}

async function markLoginCodeAsUsed(id) {
  const result = await pool.query(
    `UPDATE login_codes
     SET used = true
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  return result.rows[0];
}

module.exports = {
  createLoginCode,
  getValidLoginCode,
  markLoginCodeAsUsed,
};