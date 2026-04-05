const pool = require("../config/db");

async function createCode(code) {
  const result = await pool.query(
    `INSERT INTO license_codes (code, used, status)
     VALUES ($1, false, 'new')
     RETURNING *`,
    [code]
  );
  return result.rows[0];
}

async function getCodeByValue(code) {
  const result = await pool.query(
    `SELECT * FROM license_codes WHERE code = $1 LIMIT 1`,
    [code]
  );
  return result.rows[0];
}

async function getActiveCodeByDevice(deviceId) {
  const result = await pool.query(
    `SELECT *
     FROM license_codes
     WHERE device_id = $1
       AND status = 'active'
       AND expires_at > NOW()
     LIMIT 1`,
    [deviceId]
  );
  return result.rows[0];
}

async function markCodeActivated(id, deviceId, expiresAt) {
  const result = await pool.query(
    `UPDATE license_codes
     SET used = true,
         used_at = NOW(),
         expires_at = $2,
         device_id = $3,
         status = 'active'
     WHERE id = $1
     RETURNING *`,
    [id, expiresAt, deviceId]
  );
  return result.rows[0];
}

async function markCodeExpired(id) {
  const result = await pool.query(
    `UPDATE license_codes
     SET status = 'expired'
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0];
}

module.exports = {
  createCode,
  getCodeByValue,
  getActiveCodeByDevice,
  markCodeActivated,
  markCodeExpired,
};
