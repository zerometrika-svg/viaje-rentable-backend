const { getActiveLicense, createLicense } = require("../repositories/license.repository");
const {
  getDeviceByUserIdAndHash,
  getDeviceByHash,
  createDevice,
  updateDeviceMetadata,
  updateDeviceDemoStatus,
} = require("../repositories/device.repository");
const { createUser, getUserByEmail } = require("../repositories/user.repository");

const ADMIN_CODE = "9410123";
const ADMIN_LICENSE_DAYS = 3650;
const STATUS_LICENSE_ACTIVE = "LICENCIA_ACTIVA";

function normalizeString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function readBodyField(body, camelKey, snakeKey) {
  if (!body) return null;
  const camel = body[camelKey];
  if (camel !== undefined && camel !== null) return camel;
  const snake = body[snakeKey];
  if (snake !== undefined && snake !== null) return snake;
  return null;
}

async function activateLicense(req, res) {
  try {
    const code = req.body?.license_code || req.body?.code;
    const deviceHash = normalizeString(readBodyField(req.body, "deviceHash", "device_hash"));
    const deviceName = normalizeString(readBodyField(req.body, "deviceName", "device_name"));
    const androidId = normalizeString(readBodyField(req.body, "androidId", "android_id"));
    const androidVersion = normalizeString(
      readBodyField(req.body, "androidVersion", "android_version")
    );
    const appVersion = normalizeString(readBodyField(req.body, "appVersion", "app_version"));

    if (!code || !deviceHash) {
      return res.status(400).json({
        ok: false,
        reason: "missing_fields",
      });
    }

    if (code !== ADMIN_CODE) {
      return res.status(401).json({
        ok: false,
        reason: "invalid_code",
      });
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + ADMIN_LICENSE_DAYS * 24 * 60 * 60 * 1000
    );

    const device = await getDeviceByHash(deviceHash);

    let userId = device?.user_id || null;
    if (!userId) {
      const fallbackId = androidId || deviceHash;
      const email = `device_${fallbackId}@devices.local`;
      let user = await getUserByEmail(email);
      if (!user) {
        user = await createUser(email, deviceName || "Device");
      }
      userId = user.id;
    }

    let license = await getActiveLicense(userId);
    const licenseExpired =
      !license || !license.is_active || new Date(license.expires_at) <= now;

    if (licenseExpired) {
      license = await createLicense(userId, "admin", expiresAt);
    }

    const existingDevice = await getDeviceByUserIdAndHash(userId, deviceHash);
    if (!existingDevice) {
      const created = await createDevice(
        userId,
        deviceHash,
        deviceName || "Unknown Device",
        androidVersion,
        appVersion
      );
      if (deviceName || androidVersion || appVersion) {
        await updateDeviceMetadata(created.id, {
          deviceName,
          androidVersion,
          appVersion,
        });
      }
      await updateDeviceDemoStatus(created.id, STATUS_LICENSE_ACTIVE);
    } else {
      if (deviceName || androidVersion || appVersion) {
        await updateDeviceMetadata(existingDevice.id, {
          deviceName,
          androidVersion,
          appVersion,
        });
      }
      await updateDeviceDemoStatus(existingDevice.id, STATUS_LICENSE_ACTIVE);
    }

    return res.json({
      ok: true,
      license: {
        plan: license.plan_name,
        expiresAt: license.expires_at,
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

module.exports = {
  activateLicense,
};
