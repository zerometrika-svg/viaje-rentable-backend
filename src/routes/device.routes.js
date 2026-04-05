const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth");
const { bindDevice, checkDevice, startDemo } = require("../controllers/device.controller");

router.post("/bind", authMiddleware, bindDevice);
router.post("/check", checkDevice);
router.post("/start-demo", startDemo);

module.exports = router;
