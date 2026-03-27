const pool = require("../config/db");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        ok: false,
        reason: "missing_authorization_header",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        ok: false,
        reason: "invalid_authorization_format",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return res.status(401).json({
        ok: false,
        reason: "missing_token",
      });
    }

    const result = await pool.query(
      `
      SELECT
        s.id AS session_id,
        s.user_id,
        s.token_hash,
        s.expires_at,
        s.revoked,
        u.id AS user_real_id,
        u.email,
        u.name
      FROM sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1
      LIMIT 1
      `,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        ok: false,
        reason: "invalid_token",
      });
    }

    const session = result.rows[0];

    if (session.revoked === true) {
      return res.status(401).json({
        ok: false,
        reason: "revoked_token",
      });
    }

    const now = new Date();
    const expiresAt = new Date(session.expires_at);

    if (expiresAt <= now) {
      return res.status(401).json({
        ok: false,
        reason: "token_expired",
      });
    }

    req.auth = {
      sessionId: session.session_id,
      userId: session.user_id,
      token: session.token_hash,
      expiresAt: session.expires_at,
      user: {
        id: session.user_real_id,
        email: session.email,
        name: session.name,
      },
    };

    next();
  } catch (error) {
    console.error("❌ Error en authMiddleware:", error.message);
    return res.status(500).json({
      ok: false,
      reason: "auth_internal_error",
    });
  }
}

module.exports = authMiddleware;