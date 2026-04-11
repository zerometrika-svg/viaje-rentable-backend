const {
  createErrorReport,
  getAllErrorReports,
  markErrorReportReviewed,
} = require("../repositories/errorReport.repository");

const ALLOWED_ERROR_TYPES = new Set([
  "se_cierra_sola",
  "overlay",
  "historial",
  "graficos",
  "licencia",
  "demo",
  "login",
  "actualizacion",
  "rendimiento",
  "manual_report",
  "otro",
]);

const ALLOWED_SOURCES = new Set([
  "manual_report",
  "automatic_catch",
  "backend_validation",
  "device_check",
]);

function normalizeString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeErrorType(raw) {
  const value = normalizeString(raw);
  if (!value) return "otro";
  const normalized = value.toLowerCase().trim();
  return ALLOWED_ERROR_TYPES.has(normalized) ? normalized : "otro";
}

function normalizeSource(raw) {
  const value = normalizeString(raw);
  if (!value) return "manual_report";
  const normalized = value.toLowerCase().trim();
  return ALLOWED_SOURCES.has(normalized) ? normalized : "manual_report";
}

function normalizeScreen(raw) {
  const value = normalizeString(raw);
  if (!value) return "unknown";
  return value.toLowerCase().trim();
}

function normalizeCountry(raw) {
  const value = normalizeString(raw);
  if (!value) return null;
  const upper = value.toUpperCase();
  if (upper.length < 2) return null;
  if (upper.length > 8) return null;
  return upper;
}

async function reportError(req, res) {
  try {
    const {
      error_type,
      description,
      app_version,
      device_hash,
      device_name,
      android_version,
      country,
      screen,
      source,
      user_email,
    } = req.body || {};

    const normalizedDescription = normalizeString(description);
    if (!normalizedDescription) {
      return res.status(400).json({ ok: false, error: "description_required" });
    }

    const normalizedErrorType = normalizeErrorType(error_type);
    const normalizedSource = normalizeSource(source);
    const normalizedScreen = normalizeScreen(screen);

    const created = await createErrorReport({
      error_type: normalizedErrorType,
      description: normalizedDescription,
      app_version: normalizeString(app_version),
      device_hash: normalizeString(device_hash),
      device_name: normalizeString(device_name),
      android_version: normalizeString(android_version),
      country: normalizeCountry(country),
      screen: normalizedScreen,
      source: normalizedSource,
      user_email: normalizeString(user_email),
    });

    return res.json({ ok: true, data: created });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

async function listErrorReports(req, res) {
  try {
    const rows = await getAllErrorReports();
    return res.json({ ok: true, data: rows });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

async function reviewErrorReport(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: "invalid_id" });
    }

    const updated = await markErrorReportReviewed(id);
    if (!updated) {
      return res.status(404).json({ ok: false, error: "error_report_not_found" });
    }

    return res.json({ ok: true, data: updated });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

module.exports = {
  reportError,
  listErrorReports,
  reviewErrorReport,
};
