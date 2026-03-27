const { getActiveLicense } = require("../repositories/license.repository");
const {
  getDevicesByUserId,
  getDeviceByUserIdAndHash,
  createDevice,
  touchDevice,
} = require("../repositories/device.repository");

async function bindDevice(req, res) {
  try {
    const userId = req.auth.userId;
    const { deviceHash, deviceName } = req.body;

    if (!deviceHash) {
      return res.status(400).json({
        ok: false,
        reason: "device_hash_required",
      });
    }

    const license = await getActiveLicense(userId);

    if (!license) {
      return res.status(404).json({
        ok: false,
        reason: "no_license",
      });
    }

    const now = new Date();
    const isLicenseValid =
      license.is_active && new Date(license.expires_at) > now;

    if (!isLicenseValid) {
      return res.status(403).json({
        ok: false,
        reason: "license_inactive",
      });
    }

    const existingDevice = await getDeviceByUserIdAndHash(userId, deviceHash);

    if (existingDevice) {
      await touchDevice(existingDevice.id);

      return res.json({
        ok: true,
        message: "device_already_bound",
        device: existingDevice,
      });
    }

    const devices = await getDevicesByUserId(userId);

    if (devices.length >= license.max_devices) {
      return res.status(403).json({
        ok: false,
        reason: "max_devices_reached",
      });
    }

    const newDevice = await createDevice(
      userId,
      deviceHash,
      deviceName || "Unknown Device"
    );

    return res.json({
      ok: true,
      message: "device_bound",
      device: newDevice,
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
    const userId = req.auth.userId;
    const { deviceHash } = req.body;

    if (!deviceHash) {
      return res.status(400).json({
        ok: false,
        reason: "device_hash_required",
      });
    }

    const license = await getActiveLicense(userId);

    if (!license) {
      return res.status(404).json({
        ok: false,
        reason: "no_license",
      });
    }

    const now = new Date();
    const isLicenseValid =
      license.is_active && new Date(license.expires_at) > now;

    if (!isLicenseValid) {
      return res.status(403).json({
        ok: false,
        allowed: false,
        reason: "license_inactive",
      });
    }

    const device = await getDeviceByUserIdAndHash(userId, deviceHash);

    if (!device || !device.is_active) {
      return res.status(403).json({
        ok: false,
        allowed: false,
        reason: "device_not_allowed",
      });
    }

    await touchDevice(device.id);

    return res.json({
      ok: true,
      allowed: true,
      device,
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
  bindDevice,
  checkDevice,
};