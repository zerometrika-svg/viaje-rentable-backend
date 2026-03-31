const pool = require("../config/db");

async function healthCheck(req, res) {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      ok: true,
      message: "Backend funcionando",
      time: result.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

module.exports = {
  healthCheck,
};