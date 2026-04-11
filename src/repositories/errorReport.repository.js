const pool = require("../config/db");

async function createErrorReport(data) {
  const result = await pool.query(
    `INSERT INTO error_reports (
      error_type,
      description,
      app_version,
      device_hash,
      device_name
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [
      data.error_type,
      data.description ?? null,
      data.app_version ?? null,
      data.device_hash ?? null,
      data.device_name ?? null,
    ]
  );

  return result.rows[0];
}

async function getAllErrorReports() {
  const result = await pool.query(
    `SELECT *
     FROM error_reports
     ORDER BY created_at DESC`
  );

  return result.rows;
}

async function markErrorReportReviewed(id) {
  const result = await pool.query(
    `UPDATE error_reports
     SET status = 'reviewed'
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  createErrorReport,
  getAllErrorReports,
  markErrorReportReviewed,
};
