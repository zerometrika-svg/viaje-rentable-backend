const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const {
  bindDevice,
  checkDevice,
} = require("../controllers/device.controller");

router.post("/bind", authMiddleware, bindDevice);
router.post("/check", authMiddleware, checkDevice);

module.exports = router;