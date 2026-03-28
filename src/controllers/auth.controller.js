const { Resend } = require("resend");

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

const resend = new Resend(process.env.RESEND_API_KEY);

// 🔥 IMPORTANTE
const DEV_MODE = process.env.NODE_ENV !== "production";
const DEV_CODE = "123456";

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

    // 🔥 Código dinámico o fijo
    const code = DEV_MODE ? DEV_CODE : generateCode();
    const expiresAt = getCodeExpirationDate();

    await createLoginCode(email, code, expiresAt);

    // 🔥 En desarrollo NO mandamos mail
    if (DEV_MODE) {
      return res.json({
        ok: true,
        message: "code_generated_dev",
        testCode: DEV_CODE,
      });
    }

    // 🔥 Producción → envío real
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Tu código de acceso - Viaje Rentable",
      html: `
        <div style="font-family: Arial;">
          <h2>Viaje Rentable</h2>
          <p>Tu código es:</p>
          <h1>${code}</h1>
          <p>Vence en 5 minutos</p>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Error email:", error);

      return res.status(500).json({
        ok: false,
        reason: "email_send_failed",
      });
    }

    return res.json({
      ok: true,
      message: "code_generated",
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

    // 🔥 En desarrollo aceptamos código fijo
    if (DEV_MODE && code === DEV_CODE) {
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