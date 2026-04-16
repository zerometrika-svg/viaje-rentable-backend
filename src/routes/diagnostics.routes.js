const express = require("express");
const router = express.Router();

const {
  reportOfferFailureDiagnostic,
} = require("../controllers/uberOfferDiagnostics.controller");

router.post("/offer-failure", reportOfferFailureDiagnostic);

module.exports = router;

