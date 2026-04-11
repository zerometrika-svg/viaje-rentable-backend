const {
  createErrorReport,
  getAllErrorReports,
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

module.exports = {
  reportError,
  listErrorReports,
};

