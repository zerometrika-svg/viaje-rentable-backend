const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// TEST
app.get("/", (req, res) => {
  res.send("Backend funcionando");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// 🔥 RUTA LOGIN (LA QUE TE FALTA)
app.post("/auth/request-code", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ ok: false, error: "email requerido" });
  }

  // código fake por ahora
  const testCode = "123456";

  return res.json({
    ok: true,
    testCode
  });
});

module.exports = app;