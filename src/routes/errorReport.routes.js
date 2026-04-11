const express = require("express");
const router = express.Router();

const { reportError } = require("../controllers/errorReport.controller");

router.post("/report", reportError);

module.exports = router;