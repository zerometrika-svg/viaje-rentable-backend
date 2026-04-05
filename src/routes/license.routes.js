const express = require("express");
const { activateLicense } = require("../controllers/license.controller");

const router = express.Router();

router.post("/activate", activateLicense);

module.exports = router;
