const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

// 🔥 endpoint de prueba
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

module.exports = app;