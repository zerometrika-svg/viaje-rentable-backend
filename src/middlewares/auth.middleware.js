const { getValidSessionByTokenHash } = require("../repositories/session.repository");
const { hashToken } = require("../services/session.service");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        ok: false,
        reason: "missing_token",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const tokenHash = hashToken(token);

    const session = await getValidSessionByTokenHash(tokenHash);

    if (!session) {
      return res.status(401).json({
        ok: false,
        reason: "invalid_session",
      });
    }

    const now = new Date();
    const isExpired = new Date(session.expires_at) <= now;

    if (isExpired) {
      return res.status(401).json({
        ok: false,
        reason: "session_expired",
      });
    }

    if (session.status !== "active") {
      return res.status(403).json({
        ok: false,
        reason: "user_inactive",
      });
    }

    req.user = {
      id: session.user_id,
      email: session.email,
    };

    next();
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

module.exports = require("./auth");