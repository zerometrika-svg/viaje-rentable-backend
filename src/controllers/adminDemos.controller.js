const {
  getAdminDemos,
  getDeviceById,
  updateDeviceDemoExpiry,
  updateDeviceDemoStatus,
} = require("../repositories/device.repository");

const STATUS_DEMO_ACTIVE = "DEMO_ACTIVA";
const STATUS_DEMO_PAUSED = "DEMO_PAUSADA";
const STATUS_DEMO_EXPIRED = "DEMO_EXPIRADA";

function parseDateTime(raw) {
  if (raw === null || raw === undefined) return null;
  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function listDemos(req, res) {
  try {
    const rows = await getAdminDemos();
    return res.json({ ok: true, data: rows });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

async function updateDemo(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: "invalid_id" });
    }

    const device = await getDeviceById(id);
    if (!device) {
      return res.status(404).json({ ok: false, error: "device_not_found" });
    }

    const rawExpiresAt = req.body?.demo_expires_at ?? req.body?.demoExpiresAt;
    const demoExpiresAt = parseDateTime(rawExpiresAt);
    if (!demoExpiresAt) {
      return res.status(400).json({
        ok: false,
        error: "demo_expires_at_required",
      });
    }

    const now = new Date();
    let nextStatus = STATUS_DEMO_ACTIVE;
    if (demoExpiresAt.getTime() <= now.getTime()) {
      nextStatus = STATUS_DEMO_EXPIRED;
    } else if (device.demo_status === STATUS_DEMO_PAUSED) {
      nextStatus = STATUS_DEMO_PAUSED;
    }

    const updated = await updateDeviceDemoExpiry(id, demoExpiresAt, nextStatus);
    return res.json({ ok: true, data: updated });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

async function toggleDemo(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: "invalid_id" });
    }

    const device = await getDeviceById(id);
    if (!device) {
      return res.status(404).json({ ok: false, error: "device_not_found" });
    }

    const now = new Date();
    const expiresAt = device.demo_expires_at ? new Date(device.demo_expires_at) : null;
    const isExpired = expiresAt && !Number.isNaN(expiresAt.getTime()) && now >= expiresAt;

    if (isExpired) {
      const updated = await updateDeviceDemoStatus(id, STATUS_DEMO_EXPIRED);
      return res.json({ ok: true, data: updated, message: "demo_expired" });
    }

    const current = device.demo_status;
    if (current === STATUS_DEMO_EXPIRED) {
      return res.status(409).json({ ok: false, error: "demo_expired" });
    }

    let nextStatus = null;
    if (current === STATUS_DEMO_ACTIVE) nextStatus = STATUS_DEMO_PAUSED;
    if (current === STATUS_DEMO_PAUSED) nextStatus = STATUS_DEMO_ACTIVE;

    if (!nextStatus) {
      return res.status(400).json({
        ok: false,
        error: "invalid_demo_status",
        demo_status: current ?? null,
      });
    }

    const updated = await updateDeviceDemoStatus(id, nextStatus);
    return res.json({ ok: true, data: updated });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

module.exports = {
  listDemos,
  updateDemo,
  toggleDemo,
};

