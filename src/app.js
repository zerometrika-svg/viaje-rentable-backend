const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const adminRoutes = require("./routes/admin.routes");
const deviceRoutes = require("./routes/device.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend funcionando");
});

app.use("/health", healthRoutes);
app.use("/admin", adminRoutes);
app.use("/device", deviceRoutes);
app.use("/auth", authRoutes);

module.exports = app;