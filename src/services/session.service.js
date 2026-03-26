const crypto = require("crypto");

function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getSessionExpirationDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  return expiresAt;
}

module.exports = {
  generateSessionToken,
  hashToken,
  getSessionExpirationDate,
};