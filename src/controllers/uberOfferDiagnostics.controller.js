const {
  createUberOfferFailureDiagnostic,
  listUberOfferFailureDiagnostics,
  markUberOfferFailureReviewed,
  deleteUberOfferFailureById,
  deleteReviewedUberOfferFailures,
} = require("../repositories/uberOfferDiagnostics.repository");

function normalizeString(value, maxLen) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (typeof maxLen === "number" && maxLen > 0) return trimmed.slice(0, maxLen);
  return trimmed;
}

function normalizeNumber(value, min, max) {
  if (value === null || value === undefined) return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  if (typeof min === "number" && num < min) return null;
  if (typeof max === "number" && num > max) return null;
  return num;
}

function normalizeTexts(value) {
  if (!Array.isArray(value)) return null;
  const cleaned = value
    .map((t) => (typeof t === "string" ? t.replace(/\s+/g, " ").trim() : ""))
    .filter(Boolean)
    .slice(0, 40)
    .map((t) => t.slice(0, 140));
  return cleaned.length ? cleaned : null;
}

async function reportOfferFailureDiagnostic(req, res) {
  try {
    const body = req.body || {};

    const cleanTexts = normalizeTexts(body.cleanTexts);

    const created = await createUberOfferFailureDiagnostic({
      device_hash: normalizeString(body.deviceHash, 128),
      device_model: normalizeString(body.deviceModel, 128),
      android_version: normalizeString(body.androidVersion, 32),
      app_version: normalizeString(body.appVersion, 50),
      uber_version: normalizeString(body.uberPackageVersion, 50),
      event_type: normalizeString(body.eventType, 64),
      class_name: normalizeString(body.className, 200),
      raw_text_count: normalizeNumber(body.rawTextCount, 0, 5000),
      clean_text_count: normalizeNumber(body.cleanTextCount, 0, 5000),
      clean_texts_json: cleanTexts ? { texts: cleanTexts } : null,
      detected_precio: normalizeNumber(body.detectedPrecio, 0, 999999),
      pickup_min: normalizeNumber(body.detectedPickupMin, 0, 9999),
      pickup_km: normalizeNumber(body.detectedPickupKm, 0, 9999),
      viaje_min: normalizeNumber(body.detectedViajeMin, 0, 9999),
      viaje_km: normalizeNumber(body.detectedViajeKm, 0, 9999),
      discard_reason: normalizeString(body.discardReason, 80),
      parse_source_info: normalizeString(body.parseSourceInfo, 200),
      resolution: normalizeString(body.resolution, 32),
      density: normalizeNumber(body.density, 0, 2000),
      locale: normalizeString(body.locale, 32),
      status: "pending",
      notes: null,
    });

    return res.json({ ok: true, id: created.id });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

async function listOfferFailureDiagnosticsAdmin(req, res) {
  try {
    const { status, discard_reason, device_hash, app_version, limit } =
      req.query || {};

    const rows = await listUberOfferFailureDiagnostics({
      status: normalizeString(status, 30),
      discard_reason: normalizeString(discard_reason, 80),
      device_hash: normalizeString(device_hash, 128),
      app_version: normalizeString(app_version, 50),
      limit: normalizeNumber(limit, 1, 200),
    });

    return res.json({ ok: true, data: rows });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

async function reviewOfferFailureDiagnostic(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: "invalid_id" });
    }

    const note = normalizeString(req.body?.note, 2000);
    const updated = await markUberOfferFailureReviewed(id, note);
    if (!updated) {
      return res.status(404).json({ ok: false, error: "diagnostic_not_found" });
    }

    return res.json({ ok: true, data: updated });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

async function deleteOfferFailureDiagnostic(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: "invalid_id" });
    }

    const deleted = await deleteUberOfferFailureById(id);
    if (!deleted) {
      return res.status(404).json({ ok: false, error: "diagnostic_not_found" });
    }

    return res.json({ ok: true, data: deleted });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

async function deleteReviewedOfferFailureDiagnostics(req, res) {
  try {
    const deleted = await deleteReviewedUberOfferFailures();
    return res.json({ ok: true, deleted });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

module.exports = {
  reportOfferFailureDiagnostic,
  listOfferFailureDiagnosticsAdmin,
  reviewOfferFailureDiagnostic,
  deleteOfferFailureDiagnostic,
  deleteReviewedOfferFailureDiagnostics,
};

