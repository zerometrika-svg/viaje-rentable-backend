const pool = require("../config/db");

async function createUser(email, name) {
  const result = await pool.query(
    `INSERT INTO users (email, name)
     VALUES ($1, $2)
     RETURNING *`,
    [email, name]
  );

  return result.rows[0];
}

async function getUserByEmail(email) {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  return result.rows[0];
}

module.exports = {
  createUser,
  getUserByEmail,
};