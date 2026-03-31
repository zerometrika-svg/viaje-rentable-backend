const express = require("express");
const authMiddleware = require("../middlewares/auth");
const { activateLicense } = require("../controllers/license.controller");

const router = express.Router();

router.post("/activate", authMiddleware, activateLicense);

module.exports = router;
