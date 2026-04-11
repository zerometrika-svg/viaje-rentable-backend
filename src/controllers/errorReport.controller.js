const {
  createErrorReport,
  getAllErrorReports,
  markErrorReportReviewed,
} = require("../repositories/errorReport.repository");

async function reportError(req, res) {
  try {
    const {
      error_type,
      description,
      app_version,
      device_hash,
      device_name,
    } = req.body || {};

    if (typeof error_type !== "string" || error_type.trim() === "") {
      return res.status(400).json({ ok: false, error: "error_type_required" });
    }

    const created = await createErrorReport({
      error_type: error_type.trim(),
      description,
      app_version,
      device_hash,
      device_name,
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
