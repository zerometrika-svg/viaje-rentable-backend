const pool = require("../config/db");

async function createErrorReport(data) {
  const result = await pool.query(
    `INSERT INTO error_reports (
      error_type,
      description,
      app_version,
      device_hash,
      device_name,
      android_version,
      country,
      screen,
      source,
      user_email
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      data.error_type,
      data.description ?? null,
      data.app_version ?? null,
      data.device_hash ?? null,
      data.device_name ?? null,
      data.android_version ?? null,
      data.country ?? null,
      data.screen ?? null,
      data.source ?? null,
      data.user_email ?? null,
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

async function deleteErrorReportById(id) {
  const result = await pool.query(
    `DELETE FROM error_reports
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  return result.rows[0] || null;
}

async function deleteReviewedErrorReports() {
  const result = await pool.query(
    `DELETE FROM error_reports
     WHERE status = 'reviewed' OR status = 'revisado'`
  );

  return result.rowCount || 0;
}

async function deleteAllErrorReports() {
  const result = await pool.query(`DELETE FROM error_reports`);
  return result.rowCount || 0;
}

module.exports = {
  createErrorReport,
  getAllErrorReports,
  markErrorReportReviewed,
  deleteErrorReportById,
  deleteReviewedErrorReports,
  deleteAllErrorReports,
};
