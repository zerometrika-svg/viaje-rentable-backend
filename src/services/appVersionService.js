const pool = require('../config/db');

async function getLatestVersion() {
    const result = await pool.query(`
        SELECT *
        FROM app_releases
        WHERE active = true
        ORDER BY created_at DESC, version_code DESC
        LIMIT 1
    `);

    return result.rows[0];
}

module.exports = {
    getLatestVersion
};
