const pool = require("../config/db");

async function createLicense(userId, planName, expiresAt) {
  const result = await pool.query(
    `INSERT INTO licenses (user_id, plan_name, expires_at, is_active, max_devices)
     VALUES ($1, $2, $3, true, 1)
     RETURNING *`,
    [userId, planName, expiresAt]
  );

  return result.rows[0];
}

async function getActiveLicense(userId) {
  const result = await pool.query(
    `SELECT *
     FROM licenses
     WHERE user_id = $1
       AND is_active = true
     ORDER BY expires_at DESC
     LIMIT 1`,
    [userId]
  );

  return result.rows[0];
}

module.exports = {
  createLicense,
  getActiveLicense,
};