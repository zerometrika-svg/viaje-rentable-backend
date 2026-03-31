const express = require("express");
const router = express.Router();

const {
  requestCode,
  verifyCode,
} = require("../controllers/auth.controller");

router.post("/request-code", requestCode);
router.post("/verify-code", verifyCode);

module.exports = router;