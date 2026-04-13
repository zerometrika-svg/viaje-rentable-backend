const pool = require("../config/db");

async function listReleases() {
  const result = await pool.query(
    `SELECT id, version_name, version_code, apk_url, message, active, created_at
     FROM app_releases
     ORDER BY created_at DESC, version_code DESC`
  );

  return result.rows;
}

async function getActiveRelease() {
  const result = await pool.query(
    `SELECT id, version_name, version_code, apk_url, message, active, created_at
     FROM app_releases
     WHERE active = true
     ORDER BY created_at DESC, version_code DESC
     LIMIT 1`
  );

  return result.rows[0];
}

async function createRelease({ versionName, versionCode, apkUrl, message }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE app_releases
       SET active = false
       WHERE active = true`
    );

    const inserted = await client.query(
      `INSERT INTO app_releases (version_name, version_code, apk_url, message, active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, version_name, version_code, apk_url, message, active, created_at`,
      [versionName, versionCode, apkUrl, message]
    );

    await client.query("COMMIT");
    return inserted.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function activateRelease(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const exists = await client.query(
      `SELECT id FROM app_releases WHERE id = $1`,
      [id]
    );

    if (exists.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(
      `UPDATE app_releases
       SET active = false
       WHERE active = true
         AND id <> $1`,
      [id]
    );

    const updated = await client.query(
      `UPDATE app_releases
       SET active = true
       WHERE id = $1
       RETURNING id, version_name, version_code, apk_url, message, active, created_at`,
      [id]
    );

    await client.query("COMMIT");
    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function deleteRelease(id) {
  const result = await pool.query(
    `DELETE FROM app_releases
     WHERE id = $1
     RETURNING id, version_name, version_code, apk_url, message, active, created_at`,
    [id]
  );

  return result.rows[0];
}

module.exports = {
  listReleases,
  getActiveRelease,
  createRelease,
  activateRelease,
  deleteRelease,
};
