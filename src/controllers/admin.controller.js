const {
  createUser,
  getUserByEmail,
} = require("../repositories/user.repository");

const {
  createLicense,
  getActiveLicense,
} = require("../repositories/license.repository");

async function createUserWithLicense(req, res) {
  try {
    const { email, name, plan, days } = req.body;

    let user = await getUserByEmail(email);

    if (!user) {
      user = await createUser(email, name);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const license = await createLicense(
      user.id,
      plan,
      expiresAt
    );

    res.json({
      ok: true,
      user,
      license,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

async function checkLicense(req, res) {
  try {
    const { email } = req.body;

    const user = await getUserByEmail(email);

    if (!user) {
      return res.json({ ok: false, reason: "user_not_found" });
    }

    const license = await getActiveLicense(user.id);

    if (!license) {
      return res.json({ ok: false, reason: "no_license" });
    }

    const now = new Date();
    const isActive = new Date(license.expires_at) > now;

    res.json({
      ok: true,
      active: isActive,
      expiresAt: license.expires_at,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

module.exports = {
  createUserWithLicense,
  checkLicense,
};