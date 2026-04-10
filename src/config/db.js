const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";

function requireEnv(name) {
  const value = process.env[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const pool = isProduction
  ? new Pool({
      connectionString: requireEnv("DATABASE_URL"),
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host: requireEnv("DB_HOST"),
      port: parseInt(process.env.DB_PORT || "5432", 10),
      database: requireEnv("DB_NAME"),
      user: requireEnv("DB_USER"),
      password: requireEnv("DB_PASSWORD"),
      ssl: false,
    });

module.exports = pool;
