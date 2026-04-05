const pool = require("../config/db");

async function createLicenseSession(deviceId, tokenHash, expiresAt, licenseCodeId) {
  const result = await pool.query(
    `INSERT INTO license_sessions (device_id, token_hash, expires_at, revoked, license_code_id)
     VALUES ($1, $2, $3, false, $4)
     RETURNING *`,
    [deviceId, tokenHash, expiresAt, licenseCodeId]
  );
  return result.rows[0];
}

async function getLicenseSessionByTokenHash(tokenHash) {
  const result = await pool.query(
    `SELECT s.*, c.status AS code_status, c.expires_at AS code_expires_at, c.device_id AS code_device_id
     FROM license_sessions s
     INNER JOIN license_codes c ON c.id = s.license_code_id
     WHERE s.token_hash = $1
     LIMIT 1`,
    [tokenHash]
  );
  return result.rows[0];
}

async function revokeSessionsByDeviceId(deviceId) {
  await pool.query(
    `UPDATE license_sessions
     SET revoked = true
     WHERE device_id = $1`,
    [deviceId]
  );
}

async function revokeSessionsByCodeId(licenseCodeId) {
  await pool.query(
    `UPDATE license_sessions
     SET revoked = true
     WHERE license_code_id = $1`,
    [licenseCodeId]
  );
}

module.exports = {
  createLicenseSession,
  getLicenseSessionByTokenHash,
  revokeSessionsByDeviceId,
  revokeSessionsByCodeId,
};
