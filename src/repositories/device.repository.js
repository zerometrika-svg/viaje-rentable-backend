const pool = require("../config/db");

async function getDevicesByUserId(userId) {
  const result = await pool.query(
    `SELECT * FROM devices
     WHERE user_id = $1 AND is_active = true
     ORDER BY bound_at ASC`,
    [userId]
  );

  return result.rows;
}

async function getDeviceByUserIdAndHash(userId, deviceHash) {
  const result = await pool.query(
    `SELECT * FROM devices
     WHERE user_id = $1 AND device_hash = $2
     LIMIT 1`,
    [userId, deviceHash]
  );

  return result.rows[0];
}

async function createDevice(userId, deviceHash, deviceName) {
  const result = await pool.query(
    `INSERT INTO devices (user_id, device_hash, device_name)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, deviceHash, deviceName]
  );

  return result.rows[0];
}

async function touchDevice(deviceId) {
  const result = await pool.query(
    `UPDATE devices
     SET last_seen_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [deviceId]
  );

  return result.rows[0];
}

module.exports = {
  getDevicesByUserId,
  getDeviceByUserIdAndHash,
  createDevice,
  touchDevice,
};