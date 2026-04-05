const crypto = require("crypto");
const {
  createCode,
  getCodeByValue,
  getActiveCodeByDevice,
  markCodeActivated,
  markCodeExpired,
} = require("../repositories/licenseCode.repository");
const {
  createLicenseSession,
  getLicenseSessionByTokenHash,
  revokeSessionsByDeviceId,
  revokeSessionsByCodeId,
} = require("../repositories/licenseSession.repository");
const { generateSessionToken, hashToken } = require("../services/session.service");

const CODE_LENGTH = 9;
const CODE_COUNT = 5;
const LICENSE_DAYS = 7;

function generateSafeCode(length = CODE_LENGTH) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

async function generateCodes(req, res) {
  try {
    const created = [];
    const guard = 200;
    let attempts = 0;

    while (created.length < CODE_COUNT && attempts < guard) {
      attempts += 1;
      const code = generateSafeCode();
      try {
        const row = await createCode(code);
        created.push(row.code);
      } catch (error) {
        // Ignore duplicate code collisions
      }
    }

    if (created.length < CODE_COUNT) {
      return res.status(500).json({
        ok: false,
        reason: "code_generation_failed",
      });
    }

    return res.json({
      ok: true,
      codes: created,
      count: created.length,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

async function activateCode(req, res) {
  try {
    const code = req.body?.code;
    const deviceId = req.body?.device_id || req.body?.deviceId;

    if (!code || !deviceId) {
      return res.status(400).json({
        ok: false,
        reason: "missing_fields",
      });
    }

    const licenseCode = await getCodeByValue(code);

    if (!licenseCode) {
      return res.status(404).json({
        ok: false,
        reason: "code_not_found",
      });
    }

    if (licenseCode.used) {
      return res.status(409).json({
        ok: false,
        reason: "code_already_used",
      });
    }

    const activeDeviceCode = await getActiveCodeByDevice(deviceId);
    if (activeDeviceCode) {
      return res.status(409).json({
        ok: false,
        reason: "device_already_activated",
      });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + LICENSE_DAYS);

    const activated = await markCodeActivated(licenseCode.id, deviceId, expiresAt);
    await revokeSessionsByDeviceId(deviceId);
    await revokeSessionsByCodeId(licenseCode.id);

    const token = generateSessionToken();
    const tokenHash = hashToken(token);

    await createLicenseSession(deviceId, tokenHash, expiresAt, activated.id);

    return res.json({
      ok: true,
      token,
      expiresAt,
      deviceId,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

async function checkDevice(req, res) {
  try {
    const token = req.body?.token;
    const deviceId = req.body?.device_id || req.body?.deviceId;

    if (!token || !deviceId) {
      return res.status(400).json({
        ok: false,
        reason: "missing_fields",
      });
    }

    const tokenHash = hashToken(token);
    const session = await getLicenseSessionByTokenHash(tokenHash);

    if (!session) {
      return res.status(401).json({
        ok: false,
        reason: "invalid_token",
      });
    }

    if (session.revoked) {
      return res.status(401).json({
        ok: false,
        reason: "revoked_token",
      });
    }

    if (session.code_device_id !== deviceId) {
      return res.status(403).json({
        ok: false,
        reason: "device_mismatch",
      });
    }

    const now = new Date();
    const sessionExpired = new Date(session.expires_at) <= now;
    const codeExpired = new Date(session.code_expires_at) <= now;

    if (session.code_status === "expired" || sessionExpired || codeExpired) {
      await markCodeExpired(session.license_code_id);
      await revokeSessionsByCodeId(session.license_code_id);
      return res.status(403).json({
        ok: false,
        reason: "license_expired",
      });
    }

    return res.json({
      ok: true,
      deviceId,
      expiresAt: session.code_expires_at,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

module.exports = {
  generateCodes,
  activateCode,
  checkDevice,
};
