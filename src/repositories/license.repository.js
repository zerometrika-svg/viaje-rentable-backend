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

async function getAllLicenses() {
  const result = await pool.query(
    `SELECT
       l.id,
       l.user_id,
       l.plan_name,
       l.expires_at,
       l.is_active,
       l.max_devices,
       l.created_at,
       u.email AS user_email,
       u.name AS user_name
     FROM licenses l
     LEFT JOIN users u ON u.id = l.user_id
     ORDER BY l.created_at DESC`
  );

  return result.rows;
}

module.exports = {
  createLicense,
  getActiveLicense,
  getAllLicenses,
};
