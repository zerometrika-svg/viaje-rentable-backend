const { getActiveLicense } = require("../repositories/license.repository");
const {
  getDevicesByUserId,
  getDeviceByUserIdAndHash,
  createDevice,
  updateDeviceDemo,
  updateDeviceDemoStatus,
  touchDevice,
} = require("../repositories/device.repository");

const DEMO_DURATION_MS = 24 * 60 * 60 * 1000;
const STATUS_DEMO_ACTIVE = "DEMO_ACTIVA";
const STATUS_DEMO_EXPIRED = "DEMO_EXPIRADA";
const STATUS_LICENSE_ACTIVE = "LICENCIA_ACTIVA";

function buildDemoResponse(device, now) {
  if (device?.demo_status === STATUS_LICENSE_ACTIVE) {
    return {
      demoStartedAt: device.demo_started_at ? new Date(device.demo_started_at) : null,
      demoExpiresAt: device.demo_expires_at ? new Date(device.demo_expires_at) : null,
      demoStatus: STATUS_LICENSE_ACTIVE,
    };
  }

  let demoStartedAt = device?.demo_started_at
    ? new Date(device.demo_started_at)
    : null;
  let demoExpiresAt = device?.demo_expires_at
    ? new Date(device.demo_expires_at)
    : null;

  if (!demoStartedAt) {
    demoStartedAt = new Date(now);
  }

  if (!demoExpiresAt || demoExpiresAt.getTime() < demoStartedAt.getTime()) {
    demoExpiresAt = new Date(demoStartedAt.getTime() + DEMO_DURATION_MS);
  }

  const demoExpired = now.getTime() >= demoExpiresAt.getTime();
  const demoStatus = demoExpired ? STATUS_DEMO_EXPIRED : STATUS_DEMO_ACTIVE;

  return {
    demoStartedAt,
    demoExpiresAt,
    demoStatus,
  };
}

async function ensureDemo(device, now) {
  if (!device) return null;

  const demoData = buildDemoResponse(device, now);

  if (device.demo_status === STATUS_LICENSE_ACTIVE) {
    return { device, demo: demoData };
  }

  const needsUpdate =
    !device.demo_started_at ||
    !device.demo_expires_at ||
    device.demo_status !== demoData.demoStatus;

  if (needsUpdate) {
    const updated = await updateDeviceDemo(
      device.id,
      demoData.demoStartedAt,
      demoData.demoExpiresAt,
      demoData.demoStatus
    );
    return { device: updated, demo: demoData };
  }

  return { device, demo: demoData };
}

async function bindDevice(req, res) {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        reason: "unauthorized_user",
      });
    }

    const deviceHash = req.body?.deviceHash || req.body?.device_hash;
    const deviceName = req.body?.deviceName || req.body?.device_name;

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

      const ensuredExisting = await ensureDemo(existingDevice, now);

      return res.json({
        ok: true,
        message: "device_already_bound",
        device: ensuredExisting ? ensuredExisting.device : existingDevice,
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

    const ensuredNewDevice = await ensureDemo(newDevice, now);

    return res.json({
      ok: true,
      message: "device_bound",
      device: ensuredNewDevice ? ensuredNewDevice.device : newDevice,
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
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        allowed: false,
        reason: "unauthorized_user",
      });
    }

    const deviceHash = req.body?.deviceHash || req.body?.device_hash;

    if (!deviceHash) {
      return res.status(400).json({
        ok: false,
        reason: "device_hash_required",
      });
    }

    const now = new Date();
    const license = await getActiveLicense(userId);
    const isLicenseValid =
      license && license.is_active && new Date(license.expires_at) > now;

    let device = await getDeviceByUserIdAndHash(userId, deviceHash);

    if (!device) {
      device = await createDevice(userId, deviceHash, "Unknown Device");
    }

    if (!device.is_active) {
      return res.status(403).json({
        ok: false,
        allowed: false,
        reason: "device_not_allowed",
      });
    }

    await touchDevice(device.id);

    const demoResult = await ensureDemo(device, now);
    const demo = demoResult ? demoResult.demo : null;
    const demoActive = demo ? demo.demoStatus === STATUS_DEMO_ACTIVE : false;
    const demoExpired = demo ? demo.demoStatus === STATUS_DEMO_EXPIRED : false;
    const demoLicense = demo ? demo.demoStatus === STATUS_LICENSE_ACTIVE : false;

    const allowed = isLicenseValid || demoActive || demoLicense;
    let reason = null;

    if (!allowed && demoExpired) reason = "demo_expired";
    if (!allowed && !demoExpired && !isLicenseValid) reason = "license_inactive";

    return res.json({
      ok: true,
      allowed,
      reason,
      device: demoResult ? demoResult.device : device,
      license: license
        ? {
            plan: license.plan_name,
            expiresAt: license.expires_at,
          }
        : null,
      demo: demo
        ? {
            status: demo.demoStatus,
            startedAt: demo.demoStartedAt,
            expiresAt: demo.demoExpiresAt,
          }
        : null,
      serverTime: now.toISOString(),
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
