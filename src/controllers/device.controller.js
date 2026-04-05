const { getActiveLicense } = require("../repositories/license.repository");
const {
  getDevicesByUserId,
  getDeviceByUserIdAndHash,
  getDeviceByHash,
  createDevice,
  updateDeviceDemo,
  updateDeviceDemoStatus,
  touchDevice,
} = require("../repositories/device.repository");
const { createUser, getUserByEmail } = require("../repositories/user.repository");

const DEMO_DURATION_DAYS = 7;
const STATUS_DEMO_ACTIVE = "DEMO_ACTIVA";
const STATUS_DEMO_EXPIRED = "DEMO_EXPIRADA";
const STATUS_LICENSE_ACTIVE = "LICENCIA_ACTIVA";
const DEMO_LOG_TAG = "DEMO_FLOW";

function logDemoFlow(message, payload) {
  const suffix = payload ? ` ${JSON.stringify(payload)}` : "";
  console.log(`[${DEMO_LOG_TAG}] ${message}${suffix}`);
}

function parseDbTimestamp(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const hasTz = /Z$|[+-]\d{2}:\d{2}$/.test(trimmed);
    const normalized = hasTz
      ? trimmed
      : trimmed.replace(" ", "T");
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function buildDemoResponse(device, now) {
  if (!device) return null;

  if (device.demo_status === STATUS_LICENSE_ACTIVE) {
    return {
      demoStartedAt: parseDbTimestamp(device.demo_started_at),
      demoExpiresAt: parseDbTimestamp(device.demo_expires_at),
      demoStatus: STATUS_LICENSE_ACTIVE,
    };
  }

  if (!device.demo_started_at || !device.demo_expires_at) {
    return null;
  }

  const demoStartedAt = parseDbTimestamp(device.demo_started_at);
  const demoExpiresAt = parseDbTimestamp(device.demo_expires_at);
  if (!demoStartedAt || !demoExpiresAt) return null;
  const demoExpired = now.getTime() >= demoExpiresAt.getTime();
  const demoStatus = demoExpired ? STATUS_DEMO_EXPIRED : STATUS_DEMO_ACTIVE;

  return {
    demoStartedAt,
    demoExpiresAt,
    demoStatus,
  };
}

async function initializeDemoForDevice(device) {
  const now = new Date();
  const expires = new Date(now);
  expires.setDate(now.getDate() + DEMO_DURATION_DAYS);

  return updateDeviceDemo(device.id, now, expires, STATUS_DEMO_ACTIVE);
}

function buildCheckResponse({ device, license, demo, allowed, reason, now }) {
  return {
    ok: true,
    allowed,
    reason,
    demo_status: demo ? demo.demoStatus : null,
    demo_started_at: demo ? demo.demoStartedAt : null,
    demo_expires_at: demo ? demo.demoExpiresAt : null,
    premium_active: !!(license && license.is_active && new Date(license.expires_at) > now),
    device,
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
  };
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

      const demo = buildDemoResponse(existingDevice, now);

      return res.json({
        ok: true,
        message: "device_already_bound",
        device: existingDevice,
        demo,
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

    const ensuredNewDevice = await initializeDemoForDevice(newDevice);
    const demo = buildDemoResponse(ensuredNewDevice, now);

    return res.json({
      ok: true,
      message: "device_bound",
      device: ensuredNewDevice || newDevice,
      demo,
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
    const deviceHash = req.body?.deviceHash || req.body?.device_hash;
    const deviceName = req.body?.deviceName || req.body?.device_name;
    const androidId = req.body?.androidId || req.body?.android_id;
    logDemoFlow("device/check request", {
      device_hash: deviceHash || null,
      device_name: deviceName || null,
      android_id: androidId || null,
    });
    console.log(
      `[DEVICE_CHECK] ${req.method} ${req.originalUrl} deviceHash=${deviceHash ? "yes" : "no"}`
    );

    if (!deviceHash) {
      return res.status(400).json({
        ok: false,
        reason: "device_hash_required",
      });
    }

    const now = new Date();
    const device = await getDeviceByHash(deviceHash);

    if (!device) {
      const response = {
        ok: true,
        allowed: false,
        reason: "no_demo_started",
        serverTime: now.toISOString(),
      };
      logDemoFlow("device/check response", {
        device_hash: deviceHash,
        statusCode: 200,
        response,
      });
      return res.json(response);
    }

    const userId = device.user_id;
    const license = userId ? await getActiveLicense(userId) : null;
    const isLicenseValid =
      license && license.is_active && new Date(license.expires_at) > now;

    if (!device.is_active) {
      return res.status(403).json({
        ok: false,
        allowed: false,
        reason: "device_not_allowed",
      });
    }

    await touchDevice(device.id);

    const demo = buildDemoResponse(device, now);
    const demoActive = demo ? demo.demoStatus === STATUS_DEMO_ACTIVE : false;
    const demoExpired = demo ? demo.demoStatus === STATUS_DEMO_EXPIRED : false;
    const demoLicense = demo ? demo.demoStatus === STATUS_LICENSE_ACTIVE : false;

    logDemoFlow("device/check demo timestamps", {
      device_hash: deviceHash,
      raw_demo_started_at: device.demo_started_at || null,
      raw_demo_expires_at: device.demo_expires_at || null,
      parsed_demo_started_at: demo ? demo.demoStartedAt : null,
      parsed_demo_expires_at: demo ? demo.demoExpiresAt : null,
      now: now,
      demoExpired,
    });

    const allowed = isLicenseValid || demoActive || demoLicense;
    let reason = null;

    if (!allowed && demoExpired) reason = "demo_expired";
    if (!allowed && !demoExpired && !demo) reason = "no_demo_started";
    if (!allowed && demo && !demoExpired && !isLicenseValid) reason = "license_inactive";

    const response = buildCheckResponse({ device, license, demo, allowed, reason, now });
    logDemoFlow("device/check response", {
      device_hash: deviceHash,
      statusCode: 200,
      allowed,
      reason,
      demo_status: demo ? demo.demoStatus : null,
      demo_started_at: demo ? demo.demoStartedAt : null,
      demo_expires_at: demo ? demo.demoExpiresAt : null,
      response,
    });
    return res.json(response);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

async function startDemo(req, res) {
  try {
    const deviceHash = req.body?.deviceHash || req.body?.device_hash;
    const deviceName = req.body?.deviceName || req.body?.device_name;
    const androidId = req.body?.androidId || req.body?.android_id;
    logDemoFlow("device/start-demo request", {
      device_hash: deviceHash || null,
      device_name: deviceName || null,
      android_id: androidId || null,
    });

    if (!deviceHash) {
      return res.status(400).json({
        ok: false,
        reason: "device_hash_required",
      });
    }

    const now = new Date();
    let device = await getDeviceByHash(deviceHash);
    let userId = device?.user_id || null;

    if (!device) {
      const fallbackId = androidId || deviceHash;
      const email = `device_${fallbackId}@devices.local`;
      let user = await getUserByEmail(email);
      if (!user) {
        user = await createUser(email, deviceName || "Device");
      }
      userId = user.id;
      device = await createDevice(
        userId,
        deviceHash,
        deviceName || "Unknown Device"
      );
    }

    const license = userId ? await getActiveLicense(userId) : null;
    const isLicenseValid =
      license && license.is_active && new Date(license.expires_at) > now;

    const existingDemo = buildDemoResponse(device, now);
    if (existingDemo) {
      const demoActive = existingDemo.demoStatus === STATUS_DEMO_ACTIVE;
      const demoExpired = existingDemo.demoStatus === STATUS_DEMO_EXPIRED;
      const demoLicense = existingDemo.demoStatus === STATUS_LICENSE_ACTIVE;
      const allowed = isLicenseValid || demoActive || demoLicense;
      const reason = !allowed && demoExpired ? "demo_expired" : null;
      const response = buildCheckResponse({
        device,
        license,
        demo: existingDemo,
        allowed,
        reason,
        now,
      });
      logDemoFlow("device/start-demo response (existing)", {
        device_hash: deviceHash,
        statusCode: 200,
        allowed,
        reason,
        demo_status: existingDemo.demoStatus,
        demo_started_at: existingDemo.demoStartedAt,
        demo_expires_at: existingDemo.demoExpiresAt,
        response,
      });
      return res.json(response);
    }

    const updated = await initializeDemoForDevice(device);
    const demo = buildDemoResponse(updated, now);

    const response = buildCheckResponse({
      device: updated,
      license,
      demo,
      allowed: true,
      reason: null,
      now,
    });
    logDemoFlow("device/start-demo response (new)", {
      device_hash: deviceHash,
      statusCode: 200,
      allowed: true,
      reason: null,
      demo_status: demo ? demo.demoStatus : null,
      demo_started_at: demo ? demo.demoStartedAt : null,
      demo_expires_at: demo ? demo.demoExpiresAt : null,
      response,
    });
    return res.json(response);
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
  startDemo,
};
