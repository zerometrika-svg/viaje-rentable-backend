const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const deviceRoutes = require("./routes/device.routes");
const adminRoutes = require("./routes/admin.routes");
const authMiddleware = require("./middlewares/auth");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend funcionando");
});

app.get("/me", authMiddleware, (req, res) => {
  return res.json({
    ok: true,
    user: req.auth.user,
    session: {
      id: req.auth.sessionId,
      expiresAt: req.auth.expiresAt,
    },
  });
});

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/device", deviceRoutes);
app.use("/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: "Ruta no encontrada",
    path: req.originalUrl,
    method: req.method,
  });
});

module.exports = app;