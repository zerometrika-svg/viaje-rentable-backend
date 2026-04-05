const express = require("express");
const router = express.Router();

const {
  requestCode,
  verifyCode,
} = require("../controllers/auth.controller");
const { activateCode } = require("../controllers/licenseCode.controller");

router.post("/request-code", requestCode);
router.post("/verify-code", verifyCode);
router.post("/activate", activateCode);

module.exports = router;
