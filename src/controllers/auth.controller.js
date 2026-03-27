const {
  createUser,
  getUserByEmail,
} = require("../repositories/user.repository");

const {
  createLoginCode,
  getValidLoginCode,
  markLoginCodeAsUsed,
} = require("../repositories/loginCode.repository");

const {
  createSession,
  revokeAllUserSessions,
} = require("../repositories/session.repository");

const {
  createLicense,
  getActiveLicense,
} = require("../repositories/license.repository");

const {
  generateCode,
  getCodeExpirationDate,
} = require("../services/code.service");

const {
  generateSessionToken,
  hashToken,
  getSessionExpirationDate,
} = require("../services/session.service");

async function requestCode(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        ok: false,
        reason: "email_required",
      });
    }

    let user = await getUserByEmail(email);

    if (!user) {
      user = await createUser(email, null);

      await createLicense(
        user.id,
        "trial",
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      );
    }

    const code = generateCode();
    const expiresAt = getCodeExpirationDate();

    await createLoginCode(email, code, expiresAt);

    return res.json({
      ok: true,
      message: "code_generated",
      testCode: code,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

async function verifyCode(req, res) {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        ok: false,
        reason: "missing_fields",
      });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        ok: false,
        reason: "user_not_found",
      });
    }

    const license = await getActiveLicense(user.id);

    if (!license) {
      return res.status(403).json({
        ok: false,
        reason: "no_license",
      });
    }

    const now = new Date();
    const licenseExpired =
      new Date(license.expires_at) <= now || !license.is_active;

    if (licenseExpired) {
      return res.status(403).json({
        ok: false,
        reason: "license_inactive",
      });
    }

    const loginCode = await getValidLoginCode(email, code);

    if (!loginCode) {
      return res.status(401).json({
        ok: false,
        reason: "invalid_code",
      });
    }

    const isExpired = new Date(loginCode.expires_at) <= now;

    if (isExpired) {
      return res.status(401).json({
        ok: false,
        reason: "code_expired",
      });
    }

    await markLoginCodeAsUsed(loginCode.id);
    await revokeAllUserSessions(user.id);

    const token = generateSessionToken();
    const tokenHash = hashToken(token);
    const sessionExpiresAt = getSessionExpirationDate();

    await createSession(user.id, tokenHash, sessionExpiresAt);

    return res.json({
      ok: true,
      token,
      expiresAt: sessionExpiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

module.exports = {
  requestCode,
  verifyCode,
};