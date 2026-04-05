const { getActiveLicense, createLicense } = require("../repositories/license.repository");
const {
  getDeviceByUserIdAndHash,
  getDeviceByHash,
  createDevice,
  updateDeviceDemoStatus,
} = require("../repositories/device.repository");
const { createUser, getUserByEmail } = require("../repositories/user.repository");

const ADMIN_CODE = "9410123";
const ADMIN_LICENSE_DAYS = 3650;
const STATUS_LICENSE_ACTIVE = "LICENCIA_ACTIVA";

async function activateLicense(req, res) {
  try {
    const code = req.body?.license_code || req.body?.code;
    const deviceHash = req.body?.deviceHash || req.body?.device_hash;
    const deviceName = req.body?.deviceName || req.body?.device_name;
    const androidId = req.body?.androidId || req.body?.android_id;

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
        deviceName || "Unknown Device"
      );
      await updateDeviceDemoStatus(created.id, STATUS_LICENSE_ACTIVE);
    } else {
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
