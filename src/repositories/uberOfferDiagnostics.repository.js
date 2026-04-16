const pool = require("../config/db");

async function createUberOfferFailureDiagnostic(data) {
  const result = await pool.query(
    `
    INSERT INTO uber_offer_failure_diagnostics (
      device_hash,
      device_model,
      android_version,
      app_version,
      uber_version,
      event_type,
      class_name,
      raw_text_count,
      clean_text_count,
      clean_texts_json,
      detected_precio,
      pickup_min,
      pickup_km,
      viaje_min,
      viaje_km,
      discard_reason,
      parse_source_info,
      resolution,
      density,
      locale,
      status,
      notes
    )
    VALUES (
      $1,$2,$3,$4,$5,
      $6,$7,$8,$9,$10,
      $11,$12,$13,$14,$15,
      $16,$17,$18,$19,$20,
      $21,$22
    )
    RETURNING *
    `,
    [
      data.device_hash ?? null,
      data.device_model ?? null,
      data.android_version ?? null,
      data.app_version ?? null,
      data.uber_version ?? null,
      data.event_type ?? null,
      data.class_name ?? null,
      data.raw_text_count ?? null,
      data.clean_text_count ?? null,
      data.clean_texts_json ?? null,
      data.detected_precio ?? null,
      data.pickup_min ?? null,
      data.pickup_km ?? null,
      data.viaje_min ?? null,
      data.viaje_km ?? null,
      data.discard_reason ?? null,
      data.parse_source_info ?? null,
      data.resolution ?? null,
      data.density ?? null,
      data.locale ?? null,
      data.status ?? "pending",
      data.notes ?? null,
    ]
  );

  return result.rows[0];
}

async function listUberOfferFailureDiagnostics(filters = {}) {
  const where = [];
  const params = [];

  function addWhere(sql, value) {
    params.push(value);
    where.push(sql.replace("?", `$${params.length}`));
  }

  if (filters.status) addWhere("status = ?", filters.status);
  if (filters.discard_reason)
    addWhere("discard_reason = ?", filters.discard_reason);
  if (filters.device_hash) addWhere("device_hash = ?", filters.device_hash);
  if (filters.app_version) addWhere("app_version = ?", filters.app_version);

  const limit =
    Number.isFinite(filters.limit) && filters.limit > 0
      ? Math.min(filters.limit, 200)
      : 100;

  const query = `
    SELECT *
    FROM uber_offer_failure_diagnostics
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  const result = await pool.query(query, params);
  return result.rows;
}

async function markUberOfferFailureReviewed(id, note) {
  const result = await pool.query(
    `
    UPDATE uber_offer_failure_diagnostics
    SET status = 'reviewed',
        notes = COALESCE($2, notes)
    WHERE id = $1
    RETURNING *
    `,
    [id, note ?? null]
  );

  return result.rows[0] || null;
}

async function deleteUberOfferFailureById(id) {
  const result = await pool.query(
    `
    DELETE FROM uber_offer_failure_diagnostics
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function deleteReviewedUberOfferFailures() {
  const result = await pool.query(
    `
    DELETE FROM uber_offer_failure_diagnostics
    WHERE status = 'reviewed' OR status = 'revisado'
    `
  );

  return result.rowCount || 0;
}

module.exports = {
  createUberOfferFailureDiagnostic,
  listUberOfferFailureDiagnostics,
  markUberOfferFailureReviewed,
  deleteUberOfferFailureById,
  deleteReviewedUberOfferFailures,
};

