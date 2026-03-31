function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getCodeExpirationDate() {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5);
  return expiresAt;
}

module.exports = {
  generateCode,
  getCodeExpirationDate,
};