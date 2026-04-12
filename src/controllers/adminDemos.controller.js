const {
  getAdminDemos,
  getDeviceById,
  updateDeviceDemoExpiry,
  updateDeviceDemoStatus,
} = require("../repositories/device.repository");

const STATUS_DEMO_ACTIVE = "DEMO_ACTIVA";
const STATUS_DEMO_PAUSED = "DEMO_PAUSADA";
const STATUS_DEMO_EXPIRED = "DEMO_EXPIRADA";

function parseIsoDateTimeWithSeconds(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const hasSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})?$/.test(
    trimmed
  );
  if (!hasSeconds) return null;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;

  return { raw: trimmed, date: parsed };
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
    if (rawExpiresAt === null || rawExpiresAt === undefined || String(rawExpiresAt).trim() === "") {
      return res.status(400).json({
        ok: false,
        error: "demo_expires_at_required",
      });
    }

    const parsedExpiresAt = parseIsoDateTimeWithSeconds(rawExpiresAt);
    if (!parsedExpiresAt) {
      return res.status(400).json({
        ok: false,
        error: "invalid_demo_expires_at",
        hint: "Use ISO datetime with seconds (e.g. 2026-04-12T18:30:59 or 2026-04-12T18:30:59Z)",
      });
    }

    const { raw: demoExpiresAtRaw, date: demoExpiresAtDate } = parsedExpiresAt;

    const now = new Date();
    let nextStatus = STATUS_DEMO_ACTIVE;
    if (demoExpiresAtDate.getTime() <= now.getTime()) {
      nextStatus = STATUS_DEMO_EXPIRED;
    } else if (device.demo_status === STATUS_DEMO_PAUSED) {
      nextStatus = STATUS_DEMO_PAUSED;
    }

    const updated = await updateDeviceDemoExpiry(id, demoExpiresAtRaw, nextStatus);
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
