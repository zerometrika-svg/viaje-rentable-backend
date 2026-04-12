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

async function getDeviceByHash(deviceHash) {
  const result = await pool.query(
    `SELECT * FROM devices
     WHERE device_hash = $1
     LIMIT 1`,
    [deviceHash]
  );

  return result.rows[0];
}

// 🔥 MODIFICADO: ahora guarda android_version y app_version
async function createDevice(userId, deviceHash, deviceName, androidVersion, appVersion) {
  const result = await pool.query(
    `INSERT INTO devices (
      user_id,
      device_hash,
      device_name,
      android_version,
      app_version
    )
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, deviceHash, deviceName, androidVersion, appVersion]
  );

  return result.rows[0];
}

async function updateDeviceMetadata(deviceId, deviceName, androidVersion, appVersion) {
  const deviceNameSafe = deviceName || "Unknown Device";
  const androidVersionSafe = androidVersion || "";
  const appVersionSafe = appVersion || "";

  const result = await pool.query(
    `UPDATE devices
     SET device_name = $1,
         android_version = $2,
         app_version = $3
     WHERE id = $4
     RETURNING *`,
    [deviceNameSafe, androidVersionSafe, appVersionSafe, deviceId]
  );

  return result.rows[0];
}

async function updateDeviceDemo(deviceId, startedAt, expiresAt, status) {
  const result = await pool.query(
    `UPDATE devices
     SET demo_started_at = $2,
         demo_expires_at = $3,
         demo_status = $4
     WHERE id = $1
     RETURNING *`,
    [deviceId, startedAt, expiresAt, status]
  );

  return result.rows[0];
}

async function updateDeviceDemoStatus(deviceId, status) {
  const result = await pool.query(
    `UPDATE devices
     SET demo_status = $2
     WHERE id = $1
     RETURNING *`,
    [deviceId, status]
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

// 🔥 YA ESTÁ BIEN (no tocar)
async function getAllDevices() {
  const result = await pool.query(
    `SELECT
      d.id,
      d.user_id,
      u.email AS email,
      d.device_hash,
      d.device_name,
      d.android_version,
      d.app_version,
      d.is_active,
      d.bound_at,
      d.last_seen_at,
      d.demo_started_at,
      d.demo_expires_at,
      d.demo_status,
      d.android_id,
      d.brand,
      d.first_seen_at,
      u.email AS user_email,
      u.name AS user_name
    FROM devices d
    LEFT JOIN users u ON u.id = d.user_id
    ORDER BY d.id DESC`
  );

  return result.rows;
}

async function toggleDevice(id) {
  const result = await pool.query(
    `UPDATE devices
     SET is_active = NOT is_active
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  return result.rows[0];
}

module.exports = {
  getDevicesByUserId,
  getDeviceByUserIdAndHash,
  getDeviceByHash,
  createDevice,
  updateDeviceMetadata,
  updateDeviceDemo,
  updateDeviceDemoStatus,
  touchDevice,
  getAllDevices,
  toggleDevice,
};
