require("dotenv").config();
const app = require("./app");
const pool = require("./config/db");

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("✅ DB conectada");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar:", error.message);
    process.exit(1);
  }
}

start();